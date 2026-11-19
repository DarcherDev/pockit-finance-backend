import { ApiProperty } from '@nestjs/swagger';

export class MensajeResponse {
  @ApiProperty({
    example: 'Operación realizada exitosamente',
  })
  message!: string;
}
