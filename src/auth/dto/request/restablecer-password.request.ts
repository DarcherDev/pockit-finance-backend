import { IsString, MinLength } from 'class-validator';

export class RestablecerPasswordRequest {
  @IsString()
  @MinLength(8)
  password!: string;
}
