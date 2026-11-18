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
  };
  let configServiceMock: {
    getOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    adminMock = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue({
      auth: {
        admin: adminMock,
      },
    });

    configServiceMock = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') {
          return 'https://test-project.supabase.co';
        }
        if (key === 'SUPABASE_SECRET_KEY') {
          return 'sb_secret_test_key';
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

  it('inicializa el cliente de Supabase con autoRefreshToken y persistSession en false', () => {
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
});
