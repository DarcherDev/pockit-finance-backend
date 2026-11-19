import { Injectable } from '@nestjs/common';
import type { CuentaModel } from '../../../domain/model/cuenta.model';
import { CuentaEntity } from '../entities/cuenta.entity';

@Injectable()
export class CuentaPersistenceMapper {
  toDomain(entity: CuentaEntity): CuentaModel {
    return {
      ctaId: entity.ctaId,
      ctaUsrId: entity.ctaUsrId,
      ctaCtaPadreId: entity.ctaCtaPadreId,
      ctaNaturaleza: entity.ctaNaturaleza,
      ctaNombre: entity.ctaNombre,
      ctaSaldoInicial: entity.ctaSaldoInicial,
      ctaSaldoActual: entity.ctaSaldoActual,
      ctaColor: entity.ctaColor,
      ctaIcono: entity.ctaIcono,
      ctaActiva: entity.ctaActiva,
      ctaCreadoEn: entity.ctaCreadoEn,
      ctaActualizadoEn: entity.ctaActualizadoEn,
    };
  }
}
