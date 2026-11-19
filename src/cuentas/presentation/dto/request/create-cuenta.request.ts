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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre!: string;

  @IsIn(['BANCO', 'BILLETERA'])
  ctaNaturaleza!: NaturalezaCuenta;

  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  ctaSaldoInicial?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ctaColor!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaIcono!: string;
}
