import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponse } from '../../../../usuarios/presentation/dto/response/usuario.response';

export class LoginResponse {
  @ApiProperty({
    description: 'Token JWT de acceso emitido por Supabase Auth',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Token de refresco para renovar la sesión',
    example: 'v1.MR2x...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Tiempo de expiración del accessToken en segundos',
    example: 3600,
  })
  expiresIn!: number;

  @ApiProperty({ type: () => UsuarioResponse })
  usuario!: UsuarioResponse;
}
