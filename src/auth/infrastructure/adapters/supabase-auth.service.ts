import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { DomainException } from '../../../common/exceptions/domain.exception';
import type {
  AuthProviderUser,
  AuthSession,
  CreateAuthUserParams,
  RefreshedAuthSession,
} from '../../domain/model/auth-session.model';
import { AuthProviderPort } from '../../domain/ports/out/auth-provider.port';

@Injectable()
export class SupabaseAuthService implements AuthProviderPort {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private readonly supabase: ReturnType<typeof createClient>;
  private readonly supabasePublic: ReturnType<typeof createClient>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseSecretKey = this.configService.getOrThrow<string>(
      'SUPABASE_SECRET_KEY',
    );
    const supabasePublishableKey = this.configService.getOrThrow<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    const clientOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    };

    this.supabase = createClient(supabaseUrl, supabaseSecretKey, clientOptions);
    this.supabasePublic = createClient(
      supabaseUrl,
      supabasePublishableKey,
      clientOptions,
    );
  }

  async createUser(params: CreateAuthUserParams): Promise<AuthProviderUser> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
    });

    if (error) {
      if (error.code === 'email_exists') {
        throw new DomainException(
          'CORREO_YA_REGISTRADO',
          'El correo electrónico ya se encuentra registrado',
          HttpStatus.CONFLICT,
        );
      }

      throw new DomainException(
        'AUTH_PROVIDER_ERROR',
        'No se pudo crear el usuario en el proveedor de autenticación',
        HttpStatus.BAD_GATEWAY,
        { reason: error.message },
      );
    }

    if (!data.user?.id) {
      throw new DomainException(
        'AUTH_PROVIDER_ERROR',
        'El proveedor de autenticación no devolvió un usuario válido',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      id: data.user.id,
      email: data.user.email ?? params.email,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new DomainException(
        'AUTH_PROVIDER_ERROR',
        'No se pudo eliminar el usuario en el proveedor de autenticación',
        HttpStatus.BAD_GATEWAY,
        { reason: error.message },
      );
    }
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<AuthSession> {
    const { data, error } = await this.supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user?.id) {
      throw new DomainException(
        'CREDENCIALES_INVALIDAS',
        'Credenciales inválidas.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async refreshSession(refreshToken: string): Promise<RefreshedAuthSession> {
    const { data, error } = await this.supabasePublic.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new DomainException(
        'TOKEN_REFRESH_INVALIDO',
        'El token de renovación es inválido o ha expirado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async resetPasswordForEmail(
    email: string,
    redirectTo: string,
  ): Promise<void> {
    const { error } = await this.supabasePublic.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (error) {
      this.logger.warn(
        `resetPasswordForEmail devolvió error de proveedor (status=${error.status ?? 'unknown'})`,
      );
    }
  }

  async updatePasswordWithRecoveryToken(
    accessToken: string,
    newPassword: string,
  ): Promise<void> {
    const { data, error } = await this.supabasePublic.auth.getUser(accessToken);

    if (error || !data.user?.id) {
      throw new DomainException(
        'TOKEN_RECUPERACION_INVALIDO',
        'El token de recuperación es inválido o ha expirado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { error: updateError } =
      await this.supabase.auth.admin.updateUserById(data.user.id, {
        password: newPassword,
      });

    if (updateError) {
      if (updateError.status === 401) {
        throw new DomainException(
          'TOKEN_RECUPERACION_INVALIDO',
          'El token de recuperación es inválido o ha expirado.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new DomainException(
        'AUTH_PROVIDER_ERROR',
        'No se pudo actualizar la contraseña en el proveedor de autenticación',
        HttpStatus.BAD_GATEWAY,
        { reason: updateError.message },
      );
    }
  }
}
