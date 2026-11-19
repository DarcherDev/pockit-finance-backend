export type NaturalezaCuenta = 'BANCO' | 'BILLETERA';

export interface CuentaModel {
  ctaId: string;
  ctaUsrId: string;
  ctaCtaPadreId: string | null;
  ctaNaturaleza: NaturalezaCuenta | null;
  ctaNombre: string;
  ctaSaldoInicial: number;
  ctaSaldoActual: number;
  ctaColor: string;
  ctaIcono: string;
  ctaActiva: boolean;
  ctaCreadoEn: string;
  ctaActualizadoEn: string;
}

export interface CreateCuentaParams {
  ctaUsrId: string;
  ctaCtaPadreId: string | null;
  ctaNaturaleza: NaturalezaCuenta | null;
  ctaNombre: string;
  ctaSaldoInicial: number;
  ctaSaldoActual: number;
  ctaColor: string;
  ctaIcono: string;
  ctaActiva: boolean;
}

export interface UpdateCuentaData {
  ctaNombre?: string;
  ctaColor?: string;
  ctaIcono?: string;
  ctaNaturaleza?: NaturalezaCuenta | null;
  ctaSaldoInicial?: number;
  ctaSaldoActual?: number;
}

export interface CuentaConSaldosModel extends CuentaModel {
  saldoPropio: number;
  saldoSubcuentas: number;
  saldoConsolidado: number;
  subcuentas: CuentaModel[];
}
