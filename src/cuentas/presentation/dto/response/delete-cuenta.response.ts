import { ApiProperty } from '@nestjs/swagger';

export class DeleteCuentaResponse {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  ctaId!: string;

  @ApiProperty({ example: true })
  eliminadoFisicamente!: boolean;

  @ApiProperty({ example: false })
  ctaActiva!: boolean;

  @ApiProperty({ example: 'Cuenta eliminada físicamente' })
  mensaje!: string;
}
