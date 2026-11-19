import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'up', enum: ['up'] })
  database!: 'up';
}
