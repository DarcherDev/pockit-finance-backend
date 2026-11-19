import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
  DeleteCuentaResponse,
  ListarCuentasQueryRequest,
  UpdateCuentaRequest,
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.actualizarCuenta(user.usrId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteCuentaResponse> {
    return this.cuentasService.eliminarCuenta(user.usrId, id);
  }
}
