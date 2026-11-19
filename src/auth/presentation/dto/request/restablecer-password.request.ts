import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RestablecerPasswordRequest {
  @ApiProperty({
    minLength: 8,
    example: 'NuevaClaveSegura123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
