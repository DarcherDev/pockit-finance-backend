import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResponse {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  usrId!: string;

  @ApiProperty({
    format: 'email',
    example: 'usuario@pockit.finance',
  })
  usrCorreo!: string;

  @ApiProperty({ example: 'Daniel' })
  usrNombre!: string;

  @ApiProperty({ example: 'Aristizábal' })
  usrApellido!: string;

  @ApiProperty({ example: 28 })
  usrEdad!: number;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-19T19:00:00.000Z',
  })
  usrCreadoEn!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-19T19:00:00.000Z',
  })
  usrActualizadoEn!: string;
}
