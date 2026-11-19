import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'Nuevo token JWT de acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Nuevo token de refresco',
    example: 'v1.MR2x...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Tiempo de expiración del accessToken en segundos',
    example: 3600,
  })
  expiresIn!: number;
}
