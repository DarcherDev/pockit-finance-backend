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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ErrorResponse } from '../../../common/dto/error.response';
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

@ApiTags('Cuentas')
@ApiBearerAuth('bearer')
@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva cuenta principal' })
  @ApiCreatedResponse({
    description: 'Cuenta principal creada exitosamente',
    type: CuentaResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos de cuenta inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.crearCuentaPrincipal(user.usrId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cuentas jerárquicas del usuario' })
  @ApiOkResponse({
    description: 'Listado de cuentas principales con sus subcuentas y saldos consolidados',
    type: [CuentaJerarquicaResponse],
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
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
  @ApiOperation({ summary: 'Crear una subcuenta bajo una cuenta principal' })
  @ApiParam({
    name: 'padreId',
    format: 'uuid',
    description: 'Identificador UUID de la cuenta principal padre',
  })
  @ApiCreatedResponse({
    description: 'Subcuenta creada exitosamente',
    type: CuentaResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos o UUID inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Cuenta padre no encontrada',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Regla de jerarquía o saldo violada',
    type: ErrorResponse,
  })
  crearSubcuenta(
    @CurrentUser() user: AuthenticatedUser,
    @Param('padreId', ParseUUIDPipe) padreId: string,
    @Body() dto: CreateSubcuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.crearSubcuenta(user.usrId, padreId, dto);
  }

  @Get(':id/detalle')
  @ApiOperation({ summary: 'Obtener detalle jerárquico de una cuenta' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID de la cuenta',
  })
  @ApiOkResponse({
    description: 'Detalle jerárquico de la cuenta',
    type: CuentaJerarquicaResponse,
  })
  @ApiBadRequestResponse({
    description: 'UUID inválido',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Cuenta no encontrada',
    type: ErrorResponse,
  })
  obtenerDetalle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CuentaJerarquicaResponse> {
    return this.cuentasService.obtenerDetalleCuenta(user.usrId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una cuenta o subcuenta existente' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID de la cuenta',
  })
  @ApiOkResponse({
    description: 'Cuenta actualizada exitosamente',
    type: CuentaResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos o UUID inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Cuenta no encontrada',
    type: ErrorResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Regla de negocio de actualización violada',
    type: ErrorResponse,
  })
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCuentaRequest,
  ): Promise<CuentaResponse> {
    return this.cuentasService.actualizarCuenta(user.usrId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar físicamente o desactivar lógicamente una cuenta',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID de la cuenta',
  })
  @ApiOkResponse({
    description: 'Cuenta eliminada o desactivada exitosamente',
    type: DeleteCuentaResponse,
  })
  @ApiBadRequestResponse({
    description: 'UUID inválido',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Cuenta no encontrada',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Conflicto por subcuentas activas o estado de la cuenta',
    type: ErrorResponse,
  })
  eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteCuentaResponse> {
    return this.cuentasService.eliminarCuenta(user.usrId, id);
  }
}
