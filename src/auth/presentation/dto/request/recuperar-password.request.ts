import { IsEmail, MaxLength } from 'class-validator';

export class RecuperarPasswordRequest {
  @IsEmail()
  @MaxLength(255)
  correo!: string;
}
