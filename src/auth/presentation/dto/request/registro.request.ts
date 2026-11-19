import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegistroRequest {
  @ApiProperty({
    format: 'email',
    maxLength: 255,
    example: 'usuario@pockit.finance',
  })
  @IsEmail()
  @MaxLength(255)
  correo!: string;

  @ApiProperty({
    minLength: 8,
    example: 'MiClaveSegura123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    maxLength: 100,
    example: 'Daniel',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({
    maxLength: 100,
    example: 'Aristizábal',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido!: string;

  @ApiProperty({
    minimum: 0,
    maximum: 130,
    example: 28,
  })
  @IsInt()
  @Min(0)
  @Max(130)
  edad!: number;
}
