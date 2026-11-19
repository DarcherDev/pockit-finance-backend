import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ErrorResponse } from '../../../common/dto/error.response';
import { UsuariosService } from '../../application/services/usuarios.service';
import { UsuarioResponse } from '../dto/response/usuario.response';

@ApiTags('Usuarios')
@ApiBearerAuth('bearer')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado',
    type: UsuarioResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o ausente',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
    type: ErrorResponse,
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UsuarioResponse> {
    return this.usuariosService.obtenerPerfil(user.usrId);
  }
}
