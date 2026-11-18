import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SupabaseAuthService } from './../src/auth/services/supabase-auth.service';
import { configureApp } from './../src/common/bootstrap/configure-app';
import { DomainException } from './../src/common/exceptions/domain.exception';
import { UsuariosService } from './../src/usuarios/services/usuarios.service';

describe('HU-02.3 Recuperación y Restablecimiento de Contraseña por Correo (e2e)', () => {
  let app: INestApplication<App>;

  let supabaseAuthMock: {
    createUser: jest.Mock;
    deleteUser: jest.Mock;
    signInWithPassword: jest.Mock;
    refreshSession: jest.Mock;
    resetPasswordForEmail: jest.Mock;
    updatePasswordWithRecoveryToken: jest.Mock;
  };
  let usuariosServiceMock: {
    findById: jest.Mock;
    findByCorreo: jest.Mock;
    create: jest.Mock;
    obtenerPerfil: jest.Mock;
  };

  beforeAll(async () => {
    supabaseAuthMock = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updatePasswordWithRecoveryToken: jest.fn(),
    };

    usuariosServiceMock = {
      findById: jest.fn(),
      findByCorreo: jest.fn(),
      create: jest.fn(),
      obtenerPerfil: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          ...process.env,
          PASSWORD_RESET_REDIRECT_URL:
            'https://app.pockit.finance/auth/nueva-password',
        }),
      )
      .overrideProvider(SupabaseAuthService)
      .useValue(supabaseAuthMock)
      .overrideProvider(UsuariosService)
      .useValue(usuariosServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/auth/recuperar-password', () => {
    it('retorna 200 OK con mensaje neutro para un correo existente', async () => {
      supabaseAuthMock.resetPasswordForEmail.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/auth/recuperar-password')
        .send({ correo: 'ANA@pockit.finance' })
        .expect(200);

      expect(supabaseAuthMock.resetPasswordForEmail).toHaveBeenCalledWith(
        'ana@pockit.finance',
        'https://app.pockit.finance/auth/nueva-password',
      );
      expect(response.body).toEqual({
        message:
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    });

    it('retorna 200 OK con el mismo mensaje neutro para un correo inexistente', async () => {
      supabaseAuthMock.resetPasswordForEmail.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/auth/recuperar-password')
        .send({ correo: 'noexiste@pockit.finance' })
        .expect(200);

      expect(supabaseAuthMock.resetPasswordForEmail).toHaveBeenCalledWith(
        'noexiste@pockit.finance',
        'https://app.pockit.finance/auth/nueva-password',
      );
      expect(response.body).toEqual({
        message:
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    });

    it('retorna 400 Bad Request para un correo con formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/recuperar-password')
        .send({ correo: 'correo-invalido' })
        .expect(400);

      expect(supabaseAuthMock.resetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/restablecer-password', () => {
    it('retorna 200 OK cuando el token es válido y la contraseña tiene >= 8 caracteres', async () => {
      supabaseAuthMock.updatePasswordWithRecoveryToken.mockResolvedValue(
        undefined,
      );

      const response = await request(app.getHttpServer())
        .post('/api/auth/restablecer-password')
        .set('Authorization', 'Bearer valid-recovery-token')
        .send({ password: 'NewPassword123' })
        .expect(200);

      expect(
        supabaseAuthMock.updatePasswordWithRecoveryToken,
      ).toHaveBeenCalledWith('valid-recovery-token', 'NewPassword123');
      expect(response.body).toEqual({
        message: 'Contraseña restablecida correctamente.',
      });
    });

    it('retorna 401 Unauthorized sin header Authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/restablecer-password')
        .send({ password: 'NewPassword123' })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        code: 'TOKEN_RECUPERACION_INVALIDO',
      });
      expect(
        supabaseAuthMock.updatePasswordWithRecoveryToken,
      ).not.toHaveBeenCalled();
    });

    it('retorna 401 Unauthorized con header Authorization mal formado', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/restablecer-password')
        .set('Authorization', 'Basic abc123')
        .send({ password: 'NewPassword123' })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        code: 'TOKEN_RECUPERACION_INVALIDO',
      });
      expect(
        supabaseAuthMock.updatePasswordWithRecoveryToken,
      ).not.toHaveBeenCalled();
    });

    it('retorna 401 Unauthorized cuando el token está expirado o ya fue usado', async () => {
      supabaseAuthMock.updatePasswordWithRecoveryToken.mockRejectedValue(
        new DomainException(
          'TOKEN_RECUPERACION_INVALIDO',
          'El token de recuperación es inválido o ha expirado.',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      const response = await request(app.getHttpServer())
        .post('/api/auth/restablecer-password')
        .set('Authorization', 'Bearer expired-or-used-token')
        .send({ password: 'NewPassword123' })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        code: 'TOKEN_RECUPERACION_INVALIDO',
        message: 'El token de recuperación es inválido o ha expirado.',
      });
    });

    it('retorna 400 Bad Request cuando la contraseña tiene menos de 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/restablecer-password')
        .set('Authorization', 'Bearer valid-recovery-token')
        .send({ password: 'short' })
        .expect(400);

      expect(
        supabaseAuthMock.updatePasswordWithRecoveryToken,
      ).not.toHaveBeenCalled();
    });
  });
});
