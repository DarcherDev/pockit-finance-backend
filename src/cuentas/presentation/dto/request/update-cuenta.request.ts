import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateCuentaRequest {
  @ApiPropertyOptional({
    maxLength: 100,
    example: 'Bancolombia Nómina',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre?: string;

  @ApiPropertyOptional({
    maxLength: 20,
    example: '#2E7D32',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ctaColor?: string;

  @ApiPropertyOptional({
    maxLength: 50,
    example: 'account_balance',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaIcono?: string;

  @ApiPropertyOptional({
    enum: ['BANCO', 'BILLETERA'],
    example: 'BANCO',
  })
  @IsOptional()
  @IsIn(['BANCO', 'BILLETERA'])
  ctaNaturaleza?: NaturalezaCuenta;

  @ApiPropertyOptional({
    type: Number,
    example: 1800000,
  })
  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  ctaSaldoInicial?: number;
}
