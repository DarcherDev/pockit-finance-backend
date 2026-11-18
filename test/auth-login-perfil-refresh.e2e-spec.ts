import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createPublicKey, generateKeyPairSync } from 'crypto';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { AddressInfo } from 'net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SupabaseAuthService } from './../src/auth/services/supabase-auth.service';
import { configureApp } from './../src/common/bootstrap/configure-app';
import { DomainException } from './../src/common/exceptions/domain.exception';
import { UsuarioResponse } from './../src/usuarios/dto/response/usuario.response';
import { UsuariosService } from './../src/usuarios/services/usuarios.service';

describe('HU-02.2 Inicio de Sesión, Consulta de Perfil y Renovación de Token (e2e)', () => {
  const testSupabaseUrl = 'https://e2e-test.supabase.co';
  const expectedIssuer = `${testSupabaseUrl}/auth/v1`;
  const testKid = 'e2e-rsa-kid-login';
  const EXISTING_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  let jwksServer: http.Server;
  let app: INestApplication<App>;
  let previousJwksUrl: string | undefined;
  let previousSupabaseUrl: string | undefined;

  let supabaseAuthMock: {
    createUser: jest.Mock;
    deleteUser: jest.Mock;
    signInWithPassword: jest.Mock;
    refreshSession: jest.Mock;
  };
  let usuariosServiceMock: {
    findById: jest.Mock;
    findByCorreo: jest.Mock;
    create: jest.Mock;
    obtenerPerfil: jest.Mock;
  };

  const mockUsuario = new UsuarioResponse();
  mockUsuario.usrId = EXISTING_USER_ID;
  mockUsuario.usrCorreo = 'ana@pockit.finance';
  mockUsuario.usrNombre = 'Ana';
  mockUsuario.usrApellido = 'García';
  mockUsuario.usrEdad = 28;
  mockUsuario.usrCreadoEn = '2026-11-17T10:00:00.000Z';
  mockUsuario.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

  const signToken = (
    payload: Record<string, unknown>,
    options: jwt.SignOptions = {},
  ): string =>
    jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: testKid,
      audience: 'authenticated',
      issuer: expectedIssuer,
      expiresIn: '1h',
      ...options,
    });

  beforeAll(async () => {
    const jwk = createPublicKey(publicKey).export({ format: 'jwk' });

    jwksServer = http.createServer((req, res) => {
      if (req.url === '/.well-known/jwks.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            keys: [
              {
                ...jwk,
                kid: testKid,
                use: 'sig',
                alg: 'RS256',
              },
            ],
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      jwksServer.listen(0, '127.0.0.1', () => resolve());
    });

    const address = jwksServer.address() as AddressInfo;
    const localJwksUrl = `http://127.0.0.1:${address.port}/.well-known/jwks.json`;

    previousJwksUrl = process.env.SUPABASE_JWKS_URL;
    previousSupabaseUrl = process.env.SUPABASE_URL;
    process.env.SUPABASE_JWKS_URL = localJwksUrl;
    process.env.SUPABASE_URL = testSupabaseUrl;

    supabaseAuthMock = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
    };

    usuariosServiceMock = {
      findById: jest.fn((usrId: string) =>
        Promise.resolve(usrId === EXISTING_USER_ID ? mockUsuario : null),
      ),
      findByCorreo: jest.fn(),
      create: jest.fn(),
      obtenerPerfil: jest.fn((usrId: string) => {
        if (usrId === EXISTING_USER_ID) {
          return Promise.resolve(mockUsuario);
        }
        return Promise.reject(
          new DomainException(
            'USUARIO_NO_ENCONTRADO',
            'Usuario no encontrado.',
            HttpStatus.NOT_FOUND,
          ),
        );
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          ...process.env,
          SUPABASE_JWKS_URL: localJwksUrl,
          SUPABASE_URL: testSupabaseUrl,
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
    usuariosServiceMock.findById.mockImplementation((usrId: string) =>
      Promise.resolve(usrId === EXISTING_USER_ID ? mockUsuario : null),
    );
    usuariosServiceMock.obtenerPerfil.mockImplementation((usrId: string) => {
      if (usrId === EXISTING_USER_ID) {
        return Promise.resolve(mockUsuario);
      }
      return Promise.reject(
        new DomainException(
          'USUARIO_NO_ENCONTRADO',
          'Usuario no encontrado.',
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (jwksServer) {
      await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
    }
    if (previousJwksUrl !== undefined) {
      process.env.SUPABASE_JWKS_URL = previousJwksUrl;
    } else {
      delete process.env.SUPABASE_JWKS_URL;
    }
    if (previousSupabaseUrl !== undefined) {
      process.env.SUPABASE_URL = previousSupabaseUrl;
    } else {
      delete process.env.SUPABASE_URL;
    }
  });

  it('POST /api/auth/login retorna 200 OK con tokens y perfil de usuario', async () => {
    supabaseAuthMock.signInWithPassword.mockResolvedValue({
      userId: EXISTING_USER_ID,
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresIn: 3600,
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'ANA@pockit.finance',
        password: 'Password123',
      })
      .expect(200);

    expect(supabaseAuthMock.signInWithPassword).toHaveBeenCalledWith(
      'ana@pockit.finance',
      'Password123',
    );
    expect(response.body).toEqual({
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresIn: 3600,
      usuario: {
        usrId: EXISTING_USER_ID,
        usrCorreo: 'ana@pockit.finance',
        usrNombre: 'Ana',
        usrApellido: 'García',
        usrEdad: 28,
        usrCreadoEn: '2026-11-17T10:00:00.000Z',
        usrActualizadoEn: '2026-11-17T10:00:00.000Z',
      },
    });
  });

  it('POST /api/auth/login retorna 401 Unauthorized idéntico y genérico para contraseña incorrecta y correo inexistente', async () => {
    supabaseAuthMock.signInWithPassword.mockRejectedValue(
      new DomainException(
        'CREDENCIALES_INVALIDAS',
        'Credenciales inválidas.',
        HttpStatus.UNAUTHORIZED,
      ),
    );

    const wrongPasswordRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'ana@pockit.finance',
        password: 'WrongPassword',
      })
      .expect(401);

    const missingEmailRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'noexiste@pockit.finance',
        password: 'Password123',
      })
      .expect(401);

    expect(wrongPasswordRes.body).toEqual({
      statusCode: 401,
      code: 'CREDENCIALES_INVALIDAS',
      message: 'Credenciales inválidas.',
      details: null,
    });
    expect(missingEmailRes.body).toEqual(wrongPasswordRes.body);
  });

  it('POST /api/auth/refresh retorna 200 OK con nuevos tokens', async () => {
    supabaseAuthMock.refreshSession.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'valid-refresh-token',
      })
      .expect(200);

    expect(supabaseAuthMock.refreshSession).toHaveBeenCalledWith(
      'valid-refresh-token',
    );
    expect(response.body).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    });
  });

  it('POST /api/auth/refresh retorna 401 Unauthorized TOKEN_REFRESH_INVALIDO para refresh token inválido/expirado', async () => {
    supabaseAuthMock.refreshSession.mockRejectedValue(
      new DomainException(
        'TOKEN_REFRESH_INVALIDO',
        'El token de renovación es inválido o ha expirado.',
        HttpStatus.UNAUTHORIZED,
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'expired-refresh-token',
      })
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'TOKEN_REFRESH_INVALIDO',
      message: 'El token de renovación es inválido o ha expirado.',
      details: null,
    });
  });

  it('GET /api/usuarios/me retorna 200 OK con JWT válido', async () => {
    const token = signToken({
      sub: EXISTING_USER_ID,
      email: 'ana@pockit.finance',
    });

    const response = await request(app.getHttpServer())
      .get('/api/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(usuariosServiceMock.obtenerPerfil).toHaveBeenCalledWith(
      EXISTING_USER_ID,
    );
    expect(response.body).toEqual({
      usrId: EXISTING_USER_ID,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });

  it('GET /api/usuarios/me retorna 401 Unauthorized sin token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/usuarios/me')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      code: 'TOKEN_NO_PROPORCIONADO',
    });
  });
});
