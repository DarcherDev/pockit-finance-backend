import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { DomainException } from '../../common/exceptions/domain.exception';

export interface CreateSupabaseUserParams {
  email: string;
  password: string;
}

export interface SupabaseAuthUser {
  id: string;
  email: string;
}

@Injectable()
export class SupabaseAuthService {
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseSecretKey = this.configService.getOrThrow<string>(
      'SUPABASE_SECRET_KEY',
    );

    this.supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async createUser(
    params: CreateSupabaseUserParams,
  ): Promise<SupabaseAuthUser> {
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
}
