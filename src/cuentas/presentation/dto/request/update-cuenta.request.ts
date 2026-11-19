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
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ctaColor?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaIcono?: string;

  @IsOptional()
  @IsIn(['BANCO', 'BILLETERA'])
  ctaNaturaleza?: NaturalezaCuenta;

  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  ctaSaldoInicial?: number;
}
