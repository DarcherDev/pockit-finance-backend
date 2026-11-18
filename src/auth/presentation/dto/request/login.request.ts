import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  @MaxLength(255)
  correo!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
