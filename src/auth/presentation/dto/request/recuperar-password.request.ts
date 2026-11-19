import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class RecuperarPasswordRequest {
  @ApiProperty({
    format: 'email',
    maxLength: 255,
    example: 'usuario@pockit.finance',
  })
  @IsEmail()
  @MaxLength(255)
  correo!: string;
}
