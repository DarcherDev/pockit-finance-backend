import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoriasService } from '../../categorias/services/categorias.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
} from '../dto';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly usuariosService: UsuariosService,
    private readonly categoriasService: CategoriasService,
    private readonly dataSource: DataSource,
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
}
