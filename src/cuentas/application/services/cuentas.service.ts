import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/domain';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { roundMoney } from '../../../common/serialization/numeric-money.serializer';
import type { CuentaModel } from '../../domain/model/cuenta.model';
import {
  CUENTAS_REPOSITORY_PORT,
  type CuentasRepositoryPort,
} from '../../domain/ports/out/cuentas-repository.port';
import {
  construirDetalleCuenta,
  construirJerarquiaCuentas,
} from '../../domain/rules/cuentas-balance.rules';
import { validarCreacionSubcuenta } from '../../domain/rules/cuentas-hierarchy.rules';
import { CreateCuentaRequest } from '../../presentation/dto/request/create-cuenta.request';
import { CreateSubcuentaRequest } from '../../presentation/dto/request/create-subcuenta.request';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';
import { CuentasMapper } from '../mappers/cuentas.mapper';

@Injectable()
export class CuentasService {
  constructor(
    @Inject(CUENTAS_REPOSITORY_PORT)
    private readonly cuentasRepository: CuentasRepositoryPort,
    private readonly cuentasMapper: CuentasMapper,
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

    try {
      validarCreacionSubcuenta(padre);
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

  private async obtenerCuentaDeUsuarioOrFail(
    usrId: string,
    ctaId: string,
  ): Promise<CuentaModel> {
    const cuenta = await this.cuentasRepository.findByIdAndUsuario(
      ctaId,
      usrId,
    );

    if (!cuenta) {
      throw new DomainException(
        'CUENTA_NO_ENCONTRADA',
        'La cuenta solicitada no existe o no pertenece al usuario.',
        HttpStatus.NOT_FOUND,
      );
    }

    return cuenta;
  }
}
