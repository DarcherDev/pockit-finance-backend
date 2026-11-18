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
  @IsEmail()
  @MaxLength(255)
  correo!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido!: string;

  @IsInt()
  @Min(0)
  @Max(130)
  edad!: number;
}
