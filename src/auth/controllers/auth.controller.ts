import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { Public } from '../decorators/public.decorator';
import {
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RecuperarPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
  RestablecerPasswordRequest,
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

  @Public()
  @Post('recuperar-password')
  @HttpCode(HttpStatus.OK)
  recuperarPassword(
    @Body() dto: RecuperarPasswordRequest,
  ): Promise<MensajeResponse> {
    return this.authService.recuperarPassword(dto);
  }

  @Public()
  @Post('restablecer-password')
  @HttpCode(HttpStatus.OK)
  restablecerPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RestablecerPasswordRequest,
  ): Promise<MensajeResponse> {
    return this.authService.restablecerPassword(authorization, dto);
  }
}
