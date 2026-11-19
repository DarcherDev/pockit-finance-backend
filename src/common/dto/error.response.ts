import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({
    description: 'Código de estado HTTP de la respuesta',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Código semántico de error de aplicación o validación',
    example: 'VALIDATION_ERROR',
  })
  code!: string;

  @ApiProperty({
    description: 'Mensaje descriptivo del error',
    example: 'Error de validación',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalles adicionales del error o null cuando no aplica',
    example: ['correo must be an email'],
    nullable: true,
    required: false,
  })
  details!: unknown;
}
