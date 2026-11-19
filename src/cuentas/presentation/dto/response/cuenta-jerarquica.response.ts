import { ApiProperty } from '@nestjs/swagger';
import { CuentaResponse } from './cuenta.response';

export class CuentaJerarquicaResponse extends CuentaResponse {
  @ApiProperty({ example: 1500000.5 })
  saldoPropio!: number;

  @ApiProperty({ example: 250000 })
  saldoSubcuentas!: number;

  @ApiProperty({ example: 1750000.5 })
  saldoConsolidado!: number;

  @ApiProperty({ type: () => [CuentaResponse] })
  subcuentas!: CuentaResponse[];
}
