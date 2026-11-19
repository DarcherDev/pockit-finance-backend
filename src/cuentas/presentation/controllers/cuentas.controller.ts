import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CuentasService } from '../../application/services/cuentas.service';
import {
  CreateCuentaRequest,
  CuentaJerarquicaResponse,
  CuentaResponse,
  ListarCuentasQueryRequest,
} from '../dto';

@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.crearCuentaPrincipal(user.usrId, dto);
  }

  @Get()
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListarCuentasQueryRequest,
  ): Promise<CuentaJerarquicaResponse[]> {
    return this.cuentasService.listarCuentas(
      user.usrId,
      query.incluirInactivas ?? false,
    );
  }
}
