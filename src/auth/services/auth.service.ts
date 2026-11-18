import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { CategoriasService } from '../../categorias/services/categorias.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
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
import { SupabaseAuthService } from './supabase-auth.service';

const DEFAULT_PASSWORD_RESET_REDIRECT_URL =
  'http://localhost:4200/auth/nueva-password';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly usuariosService: UsuariosService,
    private readonly categoriasService: CategoriasService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async registrar(dto: RegistroRequest): Promise<UsuarioResponse> {
    const correoNormalizado = dto.correo.trim().toLowerCase();

    const usuarioExistente =
      await this.usuariosService.findByCorreo(correoNormalizado);
    if (usuarioExistente) {
      throw new DomainException(
        'CORREO_YA_REGISTRADO',
        'El correo electrónico ya se encuentra registrado',
        HttpStatus.CONFLICT,
      );
    }

    const authUser = await this.supabaseAuthService.createUser({
      email: correoNormalizado,
      password: dto.password,
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        const usuario = await this.usuariosService.create(
          {
            usrId: authUser.id,
            usrCorreo: correoNormalizado,
            usrNombre: dto.nombre.trim(),
            usrApellido: dto.apellido.trim(),
            usrEdad: dto.edad,
          },
          manager,
        );

        await this.categoriasService.crearCategoriasSistema(
          authUser.id,
          manager,
        );

        return usuario;
      });
    } catch (error) {
      try {
        await this.supabaseAuthService.deleteUser(authUser.id);
      } catch (compensationError) {
        this.logger.error(
          `Falló la compensación deleteUser en Supabase Auth para ${authUser.id}`,
          compensationError instanceof Error
            ? compensationError.stack
            : String(compensationError),
        );
      }

      throw error;
    }
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const correoNormalizado = dto.correo.trim().toLowerCase();
    const session = await this.supabaseAuthService.signInWithPassword(
      correoNormalizado,
      dto.password,
    );
    const usuario = await this.usuariosService.obtenerPerfil(session.userId);

    const response = new LoginResponse();
    response.accessToken = session.accessToken;
    response.refreshToken = session.refreshToken;
    response.expiresIn = session.expiresIn;
    response.usuario = usuario;
    return response;
  }

  async refresh(dto: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const session = await this.supabaseAuthService.refreshSession(
      dto.refreshToken,
    );

    const response = new RefreshTokenResponse();
    response.accessToken = session.accessToken;
    response.refreshToken = session.refreshToken;
    response.expiresIn = session.expiresIn;
    return response;
  }

  async recuperarPassword(
    dto: RecuperarPasswordRequest,
  ): Promise<MensajeResponse> {
    const correoNormalizado = dto.correo.trim().toLowerCase();
    const redirectTo = this.configService.get<string>(
      'PASSWORD_RESET_REDIRECT_URL',
      DEFAULT_PASSWORD_RESET_REDIRECT_URL,
    );

    await this.supabaseAuthService.resetPasswordForEmail(
      correoNormalizado,
      redirectTo,
    );

    const response = new MensajeResponse();
    response.message =
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
    return response;
  }

  async restablecerPassword(
    authorizationHeader: string | undefined,
    dto: RestablecerPasswordRequest,
  ): Promise<MensajeResponse> {
    const token = this.extractBearerToken(authorizationHeader);

    await this.supabaseAuthService.updatePasswordWithRecoveryToken(
      token,
      dto.password,
    );

    const response = new MensajeResponse();
    response.message = 'Contraseña restablecida correctamente.';
    return response;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new DomainException(
        'TOKEN_RECUPERACION_INVALIDO',
        'El token de recuperación es inválido o ha expirado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token?.trim()) {
      throw new DomainException(
        'TOKEN_RECUPERACION_INVALIDO',
        'El token de recuperación es inválido o ha expirado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return token.trim();
  }
}
