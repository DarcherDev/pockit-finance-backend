import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import { DomainException } from '../../common/exceptions/domain.exception';
import { SupabaseAuthService } from './supabase-auth.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseAuthService', () => {
  let service: SupabaseAuthService;
  let adminMock: {
    createUser: jest.Mock;
    deleteUser: jest.Mock;
    updateUserById: jest.Mock;
  };
  let publicAuthMock: {
    signInWithPassword: jest.Mock;
    refreshSession: jest.Mock;
    resetPasswordForEmail: jest.Mock;
    getUser: jest.Mock;
  };
  let configServiceMock: {
    getOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    adminMock = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      updateUserById: jest.fn(),
    };
    publicAuthMock = {
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
    };

    (createClient as jest.Mock).mockImplementation(
      (_url: string, key: string) => {
        if (key === 'sb_secret_test_key') {
          return {
            auth: {
              admin: adminMock,
            },
          };
        }

        return {
          auth: publicAuthMock,
        };
      },
    );

    configServiceMock = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') {
          return 'https://test-project.supabase.co';
        }
        if (key === 'SUPABASE_SECRET_KEY') {
          return 'sb_secret_test_key';
        }
        if (key === 'SUPABASE_PUBLISHABLE_KEY') {
          return 'sb_publishable_test_key';
        }
        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<SupabaseAuthService>(SupabaseAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inicializa los clientes admin y público de Supabase con autoRefreshToken y persistSession en false', () => {
    expect(createClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'sb_secret_test_key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    expect(createClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'sb_publishable_test_key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  });

  describe('createUser', () => {
    it('crea el usuario en Supabase Auth con email_confirm: true y retorna id y email', async () => {
      adminMock.createUser.mockResolvedValue({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'ana@pockit.finance',
          },
        },
        error: null,
      });

      const result = await service.createUser({
        email: 'ana@pockit.finance',
        password: 'Password123',
      });

      expect(adminMock.createUser).toHaveBeenCalledWith({
        email: 'ana@pockit.finance',
        password: 'Password123',
        email_confirm: true,
      });
      expect(result).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'ana@pockit.finance',
      });
    });

    it('lanza DomainException 409 CORREO_YA_REGISTRADO cuando Supabase reporta email_exists', async () => {
      adminMock.createUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'A user with this email address has already been registered',
          code: 'email_exists',
          status: 422,
        },
      });

      await expect(
        service.createUser({
          email: 'ana@pockit.finance',
          password: 'Password123',
        }),
      ).rejects.toMatchObject({
        code: 'CORREO_YA_REGISTRADO',
        status: HttpStatus.CONFLICT,
      });
    });

    it('lanza DomainException 502 AUTH_PROVIDER_ERROR cuando Supabase retorna otro error', async () => {
      adminMock.createUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Supabase service unavailable',
          status: 503,
        },
      });

      const promise = service.createUser({
        email: 'ana@pockit.finance',
        password: 'Password123',
      });

      await expect(promise).rejects.toBeInstanceOf(DomainException);
      await expect(promise).rejects.toMatchObject({
        code: 'AUTH_PROVIDER_ERROR',
        status: HttpStatus.BAD_GATEWAY,
      });
    });

    it('lanza DomainException 502 AUTH_PROVIDER_ERROR cuando Supabase no devuelve usuario', async () => {
      adminMock.createUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        service.createUser({
          email: 'ana@pockit.finance',
          password: 'Password123',
        }),
      ).rejects.toMatchObject({
        code: 'AUTH_PROVIDER_ERROR',
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });

  describe('deleteUser', () => {
    it('elimina el usuario en Supabase Auth para compensación', async () => {
      adminMock.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await service.deleteUser('550e8400-e29b-41d4-a716-446655440000');

      expect(adminMock.deleteUser).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('lanza DomainException 502 AUTH_PROVIDER_ERROR si falla deleteUser', async () => {
      adminMock.deleteUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Delete failed', status: 500 },
      });

      await expect(
        service.deleteUser('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toMatchObject({
        code: 'AUTH_PROVIDER_ERROR',
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });

  describe('signInWithPassword', () => {
    it('autentica con el cliente público y retorna userId, accessToken, refreshToken y expiresIn', async () => {
      publicAuthMock.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'ana@pockit.finance',
          },
          session: {
            access_token: 'jwt-access-token',
            refresh_token: 'jwt-refresh-token',
            expires_in: 3600,
          },
        },
        error: null,
      });

      const result = await service.signInWithPassword(
        'ana@pockit.finance',
        'Password123',
      );

      expect(publicAuthMock.signInWithPassword).toHaveBeenCalledWith({
        email: 'ana@pockit.finance',
        password: 'Password123',
      });
      expect(result).toEqual({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
      });
    });

    it('lanza DomainException 401 CREDENCIALES_INVALIDAS ante error de credenciales o email no confirmado', async () => {
      publicAuthMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Email not confirmed',
          status: 400,
        },
      });

      const promise = service.signInWithPassword(
        'ana@pockit.finance',
        'WrongPass',
      );

      await expect(promise).rejects.toBeInstanceOf(DomainException);
      await expect(promise).rejects.toMatchObject({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Credenciales inválidas.',
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('lanza DomainException 401 CREDENCIALES_INVALIDAS si no retorna sesión o usuario', async () => {
      publicAuthMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      await expect(
        service.signInWithPassword('ana@pockit.finance', 'Password123'),
      ).rejects.toMatchObject({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Credenciales inválidas.',
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('refreshSession', () => {
    it('renueva la sesión con el cliente público y retorna accessToken, refreshToken y expiresIn', async () => {
      publicAuthMock.refreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        },
        error: null,
      });

      const result = await service.refreshSession('old-refresh-token');

      expect(publicAuthMock.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'old-refresh-token',
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });

    it('lanza DomainException 401 TOKEN_REFRESH_INVALIDO cuando el refresh token es inválido o expiró', async () => {
      publicAuthMock.refreshSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Invalid Refresh Token: Refresh Token Not Found',
          status: 400,
        },
      });

      const promise = service.refreshSession('expired-refresh-token');

      await expect(promise).rejects.toBeInstanceOf(DomainException);
      await expect(promise).rejects.toMatchObject({
        code: 'TOKEN_REFRESH_INVALIDO',
        message: 'El token de renovación es inválido o ha expirado.',
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('lanza DomainException 401 TOKEN_REFRESH_INVALIDO cuando Supabase no retorna sesión', async () => {
      publicAuthMock.refreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        service.refreshSession('missing-session-token'),
      ).rejects.toMatchObject({
        code: 'TOKEN_REFRESH_INVALIDO',
        message: 'El token de renovación es inválido o ha expirado.',
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('resetPasswordForEmail', () => {
    it('invoca resetPasswordForEmail en el cliente público con redirectTo y resuelve sin revelar existencia', async () => {
      publicAuthMock.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(
        service.resetPasswordForEmail(
          'ana@pockit.finance',
          'http://localhost:4200/auth/nueva-password',
        ),
      ).resolves.toBeUndefined();

      expect(publicAuthMock.resetPasswordForEmail).toHaveBeenCalledWith(
        'ana@pockit.finance',
        { redirectTo: 'http://localhost:4200/auth/nueva-password' },
      );
    });

    it('no filtra ni lanza error cuando Supabase responde error (correo no encontrado o rate limit)', async () => {
      publicAuthMock.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: {
          message: 'User not found',
          status: 400,
        },
      });

      await expect(
        service.resetPasswordForEmail(
          'noexiste@pockit.finance',
          'http://localhost:4200/auth/nueva-password',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('updatePasswordWithRecoveryToken', () => {
    it('valida el token con getUser y actualiza la contraseña con admin.updateUserById', async () => {
      publicAuthMock.getUser.mockResolvedValue({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'ana@pockit.finance',
          },
        },
        error: null,
      });
      adminMock.updateUserById.mockResolvedValue({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
        error: null,
      });

      await expect(
        service.updatePasswordWithRecoveryToken(
          'valid-recovery-token',
          'NewPassword123',
        ),
      ).resolves.toBeUndefined();

      expect(publicAuthMock.getUser).toHaveBeenCalledWith(
        'valid-recovery-token',
      );
      expect(adminMock.updateUserById).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        { password: 'NewPassword123' },
      );
    });

    it('lanza DomainException 401 TOKEN_RECUPERACION_INVALIDO cuando getUser retorna error (token expirado o inválido)', async () => {
      publicAuthMock.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'invalid claim: missing sub claim',
          status: 401,
        },
      });

      const promise = service.updatePasswordWithRecoveryToken(
        'expired-token',
        'NewPassword123',
      );

      await expect(promise).rejects.toBeInstanceOf(DomainException);
      await expect(promise).rejects.toMatchObject({
        code: 'TOKEN_RECUPERACION_INVALIDO',
        message: 'El token de recuperación es inválido o ha expirado.',
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(adminMock.updateUserById).not.toHaveBeenCalled();
    });

    it('lanza DomainException 401 TOKEN_RECUPERACION_INVALIDO cuando getUser no retorna usuario', async () => {
      publicAuthMock.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        service.updatePasswordWithRecoveryToken(
          'used-or-empty-token',
          'NewPassword123',
        ),
      ).rejects.toMatchObject({
        code: 'TOKEN_RECUPERACION_INVALIDO',
        message: 'El token de recuperación es inválido o ha expirado.',
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(adminMock.updateUserById).not.toHaveBeenCalled();
    });

    it('lanza DomainException 502 AUTH_PROVIDER_ERROR cuando admin.updateUserById falla', async () => {
      publicAuthMock.getUser.mockResolvedValue({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
        error: null,
      });
      adminMock.updateUserById.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Database error updating user',
          status: 500,
        },
      });

      const promise = service.updatePasswordWithRecoveryToken(
        'valid-recovery-token',
        'NewPassword123',
      );

      await expect(promise).rejects.toBeInstanceOf(DomainException);
      await expect(promise).rejects.toMatchObject({
        code: 'AUTH_PROVIDER_ERROR',
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });
});
