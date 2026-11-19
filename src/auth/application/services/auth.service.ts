import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoriasService } from '../../../categorias/application/services/categorias.service';
import { DomainError, UNIT_OF_WORK_PORT } from '../../../common/domain';
import type { UnitOfWorkPort } from '../../../common/domain';
import { UsuarioResponse } from '../../../usuarios/presentation/dto/response/usuario.response';
import { UsuariosService } from '../../../usuarios/application/services/usuarios.service';
import { AUTH_PROVIDER_PORT } from '../../domain/ports/out/auth-provider.port';
import type { AuthProviderPort } from '../../domain/ports/out/auth-provider.port';
import {
  extractRecoveryBearerToken,
  normalizeEmail,
} from '../../domain/rules/auth-credentials.rules';
import {
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RecuperarPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
  RestablecerPasswordRequest,
} from '../../presentation/dto';

const DEFAULT_PASSWORD_RESET_REDIRECT_URL =
  'http://localhost:4200/auth/nueva-password';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_PROVIDER_PORT)
    private readonly authProvider: AuthProviderPort,
    private readonly usuariosService: UsuariosService,
    private readonly categoriasService: CategoriasService,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly configService: ConfigService,
  ) {}

  async registrar(dto: RegistroRequest): Promise<UsuarioResponse> {
    const correoNormalizado = normalizeEmail(dto.correo);

    const usuarioExistente =
      await this.usuariosService.findByCorreo(correoNormalizado);
    if (usuarioExistente) {
      throw new DomainError(
        'CORREO_YA_REGISTRADO',
        'El correo electrónico ya se encuentra registrado',
        409,
      );
    }

    const authUser = await this.authProvider.createUser({
      email: correoNormalizado,
      password: dto.password,
    });

    try {
      return await this.unitOfWork.runInTransaction(async (tx) => {
        const usuario = await this.usuariosService.create(
          {
            usrId: authUser.id,
            usrCorreo: correoNormalizado,
            usrNombre: dto.nombre.trim(),
            usrApellido: dto.apellido.trim(),
            usrEdad: dto.edad,
          },
          tx,
        );

        await this.categoriasService.crearCategoriasSistema(authUser.id, tx);

        return usuario;
      });
    } catch (error) {
      await this.compensateCreatedAuthUser(authUser.id);
      throw error;
    }
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const correoNormalizado = normalizeEmail(dto.correo);
    const session = await this.authProvider.signInWithPassword(
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
    const session = await this.authProvider.refreshSession(dto.refreshToken);

    const response = new RefreshTokenResponse();
    response.accessToken = session.accessToken;
    response.refreshToken = session.refreshToken;
    response.expiresIn = session.expiresIn;
    return response;
  }

  async recuperarPassword(
    dto: RecuperarPasswordRequest,
  ): Promise<MensajeResponse> {
    const correoNormalizado = normalizeEmail(dto.correo);
    const redirectTo = this.configService.get<string>(
      'PASSWORD_RESET_REDIRECT_URL',
      DEFAULT_PASSWORD_RESET_REDIRECT_URL,
    );

    await this.authProvider.resetPasswordForEmail(
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
    const token = extractRecoveryBearerToken(authorizationHeader);

    await this.authProvider.updatePasswordWithRecoveryToken(
      token,
      dto.password,
    );

    const response = new MensajeResponse();
    response.message = 'Contraseña restablecida correctamente.';
    return response;
  }

  private async compensateCreatedAuthUser(userId: string): Promise<void> {
    try {
      await this.authProvider.deleteUser(userId);
    } catch (compensationError) {
      this.logger.error(
        `Falló la compensación deleteUser en Supabase Auth para ${userId}`,
        compensationError instanceof Error
          ? compensationError.stack
          : String(compensationError),
      );
    }
  }
}
