import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../../common/dto/error.response';
import { UsuarioResponse } from '../../../usuarios/presentation/dto/response/usuario.response';
import { AuthService } from '../../application/services/auth.service';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario en Pockit Finance' })
  @ApiCreatedResponse({
    description: 'Usuario registrado exitosamente',
    type: UsuarioResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos de registro inválidos',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'El correo ya se encuentra registrado',
    type: ErrorResponse,
  })
  registrar(@Body() dto: RegistroRequest): Promise<UsuarioResponse> {
    return this.authService.registrar(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiOkResponse({
    description: 'Sesión iniciada exitosamente',
    type: LoginResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos de login inválidos',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: ErrorResponse,
  })
  login(@Body() dto: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar accessToken mediante refreshToken' })
  @ApiOkResponse({
    description: 'Token renovado exitosamente',
    type: RefreshTokenResponse,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido o expirado',
    type: ErrorResponse,
  })
  refresh(@Body() dto: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('recuperar-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar enlace de recuperación de contraseña por correo',
  })
  @ApiOkResponse({
    description: 'Solicitud procesada',
    type: MensajeResponse,
  })
  @ApiBadRequestResponse({
    description: 'Correo inválido',
    type: ErrorResponse,
  })
  recuperarPassword(
    @Body() dto: RecuperarPasswordRequest,
  ): Promise<MensajeResponse> {
    return this.authService.recuperarPassword(dto);
  }

  @Public()
  @Post('restablecer-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Restablecer contraseña utilizando token de recuperación',
  })
  @ApiOkResponse({
    description: 'Contraseña actualizada exitosamente',
    type: MensajeResponse,
  })
  @ApiBadRequestResponse({
    description: 'Contraseña inválida',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de recuperación inválido o ausente',
    type: ErrorResponse,
  })
  restablecerPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RestablecerPasswordRequest,
  ): Promise<MensajeResponse> {
    return this.authService.restablecerPassword(authorization, dto);
  }
}
