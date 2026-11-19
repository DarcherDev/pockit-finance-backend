import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransformMoney } from '../../../../common/serialization';
import type { NaturalezaCuenta } from '../../../domain/model/cuenta.model';

export class CreateCuentaRequest {
  @ApiProperty({
    maxLength: 100,
    example: 'Bancolombia Ahorros',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre!: string;

  @ApiProperty({
    enum: ['BANCO', 'BILLETERA'],
    example: 'BANCO',
  })
  @IsIn(['BANCO', 'BILLETERA'])
  ctaNaturaleza!: NaturalezaCuenta;

  @ApiPropertyOptional({
    type: Number,
    example: 1500000.5,
  })
  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  ctaSaldoInicial?: number;

  @ApiProperty({
    maxLength: 20,
    example: '#2E7D32',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ctaColor!: string;

  @ApiProperty({
    maxLength: 50,
    example: 'account_balance',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaIcono!: string;
}
