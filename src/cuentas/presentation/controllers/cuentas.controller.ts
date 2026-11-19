import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CuentasService } from '../../application/services/cuentas.service';
import {
  CreateCuentaRequest,
  CreateSubcuentaRequest,
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

  @Post(':padreId/subcuentas')
  @HttpCode(HttpStatus.CREATED)
  crearSubcuenta(
    @CurrentUser() user: AuthenticatedUser,
    @Param('padreId', ParseUUIDPipe) padreId: string,
    @Body() dto: CreateSubcuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.crearSubcuenta(user.usrId, padreId, dto);
  }

  @Get(':id/detalle')
  obtenerDetalle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CuentaJerarquicaResponse> {
    return this.cuentasService.obtenerDetalleCuenta(user.usrId, id);
  }
}
