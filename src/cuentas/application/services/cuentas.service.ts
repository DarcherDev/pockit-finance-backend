import { Inject, Injectable } from '@nestjs/common';
import { roundMoney } from '../../../common/serialization/numeric-money.serializer';
import {
  CUENTAS_REPOSITORY_PORT,
  type CuentasRepositoryPort,
} from '../../domain/ports/out/cuentas-repository.port';
import { construirJerarquiaCuentas } from '../../domain/rules/cuentas-balance.rules';
import { CreateCuentaRequest } from '../../presentation/dto/request/create-cuenta.request';
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
}
