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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaNombre!: string;

  @IsOptional()
  @TransformMoney()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
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
