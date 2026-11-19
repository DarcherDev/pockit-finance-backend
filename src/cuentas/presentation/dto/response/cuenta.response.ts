import { ApiProperty } from '@nestjs/swagger';
import type { NaturalezaCuenta } from '../../../domain/model/cuenta.model';

export class CuentaResponse {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  ctaId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  ctaUsrId!: string;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    example: null,
  })
  ctaCtaPadreId!: string | null;

  @ApiProperty({
    enum: ['BANCO', 'BILLETERA'],
    nullable: true,
    example: 'BANCO',
  })
  ctaNaturaleza!: NaturalezaCuenta | null;

  @ApiProperty({ example: 'Bancolombia Ahorros' })
  ctaNombre!: string;

  @ApiProperty({ example: 1500000.5 })
  ctaSaldoInicial!: number;

  @ApiProperty({ example: 1500000.5 })
  ctaSaldoActual!: number;

  @ApiProperty({ example: '#2E7D32' })
  ctaColor!: string;

  @ApiProperty({ example: 'account_balance' })
  ctaIcono!: string;

  @ApiProperty({ example: true })
  ctaActiva!: boolean;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-19T19:00:00.000Z',
  })
  ctaCreadoEn!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-19T19:00:00.000Z',
  })
  ctaActualizadoEn!: string;
}
