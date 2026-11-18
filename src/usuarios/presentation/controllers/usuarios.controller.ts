import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UsuariosService } from '../../application/services/usuarios.service';
import { UsuarioResponse } from '../dto/response/usuario.response';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<UsuarioResponse> {
    return this.usuariosService.obtenerPerfil(user.usrId);
  }
}
