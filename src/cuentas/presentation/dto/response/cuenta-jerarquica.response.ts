import { CuentaResponse } from './cuenta.response';

export class CuentaJerarquicaResponse extends CuentaResponse {
  saldoPropio!: number;
  saldoSubcuentas!: number;
  saldoConsolidado!: number;
  subcuentas!: CuentaResponse[];
}
