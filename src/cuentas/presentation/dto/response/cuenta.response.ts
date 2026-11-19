import type { NaturalezaCuenta } from '../../../domain/model/cuenta.model';

export class CuentaResponse {
  ctaId!: string;
  ctaUsrId!: string;
  ctaCtaPadreId!: string | null;
  ctaNaturaleza!: NaturalezaCuenta | null;
  ctaNombre!: string;
  ctaSaldoInicial!: number;
  ctaSaldoActual!: number;
  ctaColor!: string;
  ctaIcono!: string;
  ctaActiva!: boolean;
  ctaCreadoEn!: string;
  ctaActualizadoEn!: string;
}
