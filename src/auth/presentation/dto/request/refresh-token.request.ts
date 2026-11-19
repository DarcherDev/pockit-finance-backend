import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Token de refresco vigente emitido en el login',
    example: 'v1.MR2x...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
