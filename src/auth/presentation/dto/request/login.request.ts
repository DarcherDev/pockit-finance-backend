import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    format: 'email',
    maxLength: 255,
    example: 'usuario@pockit.finance',
  })
  @IsEmail()
  @MaxLength(255)
  correo!: string;

  @ApiProperty({
    example: 'MiClaveSegura123!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
