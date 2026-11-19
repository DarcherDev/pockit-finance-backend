import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListarCuentasQueryRequest {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Indica si se deben incluir cuentas inactivas en el listado',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  incluirInactivas?: boolean = false;
}
