import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { Public } from '../decorators/public.decorator';
import { RegistroRequest } from '../dto/request/registro.request';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() dto: RegistroRequest): Promise<UsuarioResponse> {
    return this.authService.registrar(dto);
  }
}
