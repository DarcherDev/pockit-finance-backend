import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TransformMoney } from '../../../../common/serialization';

export class CreateSubcuentaRequest {
  @ApiProperty({
    maxLength: 100,
    example: 'Bolsillo Emergencias',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre!: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    example: 250000,
  })
  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ctaSaldoInicial?: number;

  @ApiProperty({
    maxLength: 20,
    example: '#1565C0',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ctaColor!: string;

  @ApiProperty({
    maxLength: 50,
    example: 'savings',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaIcono!: string;
}
