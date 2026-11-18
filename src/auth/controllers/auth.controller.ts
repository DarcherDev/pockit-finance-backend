import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { Public } from '../decorators/public.decorator';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
} from '../dto';
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

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.authService.refresh(dto);
  }
}
