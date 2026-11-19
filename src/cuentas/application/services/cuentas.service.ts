import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  DomainError,
  UNIT_OF_WORK_PORT,
  type UnitOfWorkPort,
} from '../../../common/domain';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { roundMoney } from '../../../common/serialization/numeric-money.serializer';
import type {
  CuentaModel,
  UpdateCuentaData,
} from '../../domain/model/cuenta.model';
import {
  CUENTAS_REPOSITORY_PORT,
  type CuentasRepositoryPort,
} from '../../domain/ports/out/cuentas-repository.port';
import {
  construirDetalleCuenta,
  construirJerarquiaCuentas,
} from '../../domain/rules/cuentas-balance.rules';
import { validarCreacionSubcuenta } from '../../domain/rules/cuentas-hierarchy.rules';
import {
  calcularActualizacionSaldoInicial,
  validarEdicionCuenta,
} from '../../domain/rules/cuentas-mutation.rules';
import { CreateCuentaRequest } from '../../presentation/dto/request/create-cuenta.request';
import { CreateSubcuentaRequest } from '../../presentation/dto/request/create-subcuenta.request';
import { UpdateCuentaRequest } from '../../presentation/dto/request/update-cuenta.request';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';
import { DeleteCuentaResponse } from '../../presentation/dto/response/delete-cuenta.response';
import { CuentasMapper } from '../mappers/cuentas.mapper';

@Injectable()
export class CuentasService {
  constructor(
    @Inject(CUENTAS_REPOSITORY_PORT)
    private readonly cuentasRepository: CuentasRepositoryPort,
    private readonly cuentasMapper: CuentasMapper,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  async crearCuentaPrincipal(
    usrId: string,
    dto: CreateCuentaRequest,
  ): Promise<CuentaResponse> {
    const saldoInicial = roundMoney(dto.ctaSaldoInicial ?? 0);

    const created = await this.cuentasRepository.create({
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: dto.ctaNaturaleza,
      ctaNombre: dto.ctaNombre,
      ctaSaldoInicial: saldoInicial,
      ctaSaldoActual: saldoInicial,
      ctaColor: dto.ctaColor,
      ctaIcono: dto.ctaIcono,
      ctaActiva: true,
    });

    return this.cuentasMapper.toResponse(created);
  }

  async listarCuentas(
    usrId: string,
    incluirInactivas = false,
  ): Promise<CuentaJerarquicaResponse[]> {
    const cuentas = await this.cuentasRepository.findAllByUsuario(
      usrId,
      incluirInactivas,
    );

    return construirJerarquiaCuentas(cuentas, incluirInactivas).map((cuenta) =>
      this.cuentasMapper.toJerarquicaResponse(cuenta),
    );
  }

  async crearSubcuenta(
    usrId: string,
    padreId: string,
    dto: CreateSubcuentaRequest,
  ): Promise<CuentaResponse> {
    const padre = await this.obtenerCuentaDeUsuarioOrFail(usrId, padreId);

    this.ejecutarReglaDominio(() => validarCreacionSubcuenta(padre));

    const saldoInicial = roundMoney(dto.ctaSaldoInicial ?? 0);

    const created = await this.cuentasRepository.create({
      ctaUsrId: usrId,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: dto.ctaNombre,
      ctaSaldoInicial: saldoInicial,
      ctaSaldoActual: saldoInicial,
      ctaColor: dto.ctaColor,
      ctaIcono: dto.ctaIcono,
      ctaActiva: true,
    });

    return this.cuentasMapper.toResponse(created);
  }

  async obtenerDetalleCuenta(
    usrId: string,
    ctaId: string,
  ): Promise<CuentaJerarquicaResponse> {
    const cuenta = await this.obtenerCuentaDeUsuarioOrFail(usrId, ctaId);
    const subcuentas = await this.cuentasRepository.findSubcuentasByPadreId(
      ctaId,
      usrId,
    );

    const detalle = construirDetalleCuenta(cuenta, subcuentas);
    return this.cuentasMapper.toJerarquicaResponse(detalle);
  }

  async actualizarCuenta(
    usrId: string,
    ctaId: string,
    dto: UpdateCuentaRequest,
  ): Promise<CuentaResponse> {
    return this.unitOfWork.runInTransaction(async (tx) => {
      const cuenta = await this.cuentasRepository.findByIdAndUsuarioForUpdate(
        ctaId,
        usrId,
        tx,
      );

      if (!cuenta) {
        throw this.crearCuentaNoEncontradaException();
      }

      this.ejecutarReglaDominio(() =>
        validarEdicionCuenta(cuenta, dto.ctaNaturaleza !== undefined),
      );

      const updateData: UpdateCuentaData = {};
      if (dto.ctaNombre !== undefined) {
        updateData.ctaNombre = dto.ctaNombre;
      }
      if (dto.ctaColor !== undefined) {
        updateData.ctaColor = dto.ctaColor;
      }
      if (dto.ctaIcono !== undefined) {
        updateData.ctaIcono = dto.ctaIcono;
      }
      if (dto.ctaNaturaleza !== undefined) {
        updateData.ctaNaturaleza = dto.ctaNaturaleza;
      }
      if (dto.ctaSaldoInicial !== undefined) {
        const saldos = calcularActualizacionSaldoInicial(
          cuenta.ctaSaldoInicial,
          cuenta.ctaSaldoActual,
          dto.ctaSaldoInicial,
        );
        updateData.ctaSaldoInicial = saldos.ctaSaldoInicial;
        updateData.ctaSaldoActual = saldos.ctaSaldoActual;
      }

      const updated = await this.cuentasRepository.updateById(
        ctaId,
        usrId,
        updateData,
        tx,
      );

      return this.cuentasMapper.toResponse(updated);
    });
  }

  async eliminarCuenta(
    usrId: string,
    ctaId: string,
  ): Promise<DeleteCuentaResponse> {
    return this.unitOfWork.runInTransaction(async (tx) => {
      const cuentasBloqueadas =
        await this.cuentasRepository.findCuentaYSubcuentasForUpdate(
          ctaId,
          usrId,
          tx,
        );

      if (cuentasBloqueadas.length === 0) {
        throw this.crearCuentaNoEncontradaException();
      }

      const ctaIds = cuentasBloqueadas.map((cuenta) => cuenta.ctaId);
      const { total, pendientes } =
        await this.cuentasRepository.contarTransaccionesPorCuentas(ctaIds, tx);

      if (pendientes > 0) {
        throw new DomainException(
          'CUENTA_CON_TRANSACCIONES_PENDIENTES',
          'No se puede eliminar ni desactivar una cuenta con transacciones pendientes.',
          HttpStatus.CONFLICT,
        );
      }

      const response = new DeleteCuentaResponse();
      response.ctaId = ctaId;
      response.ctaActiva = false;

      if (total > 0) {
        await this.cuentasRepository.desactivarCuentas(ctaIds, usrId, tx);
        response.eliminadoFisicamente = false;
        response.mensaje =
          'Cuenta desactivada lógicamente por poseer historial contable';
        return response;
      }

      await this.cuentasRepository.deleteByIdAndUsuario(ctaId, usrId, tx);
      response.eliminadoFisicamente = true;
      response.mensaje = 'Cuenta eliminada definitivamente';
      return response;
    });
  }

  private async obtenerCuentaDeUsuarioOrFail(
    usrId: string,
    ctaId: string,
  ): Promise<CuentaModel> {
    const cuenta = await this.cuentasRepository.findByIdAndUsuario(
      ctaId,
      usrId,
    );

    if (!cuenta) {
      throw this.crearCuentaNoEncontradaException();
    }

    return cuenta;
  }

  private crearCuentaNoEncontradaException(): DomainException {
    return new DomainException(
      'CUENTA_NO_ENCONTRADA',
      'La cuenta solicitada no existe o no pertenece al usuario.',
      HttpStatus.NOT_FOUND,
    );
  }

  private ejecutarReglaDominio(regla: () => void): void {
    try {
      regla();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainException(
          error.code,
          error.message,
          error.statusCode,
          error.details,
        );
      }
      throw error;
    }
  }
}
