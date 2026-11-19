import {
  Body,
  Controller,
  Get,
  INestApplication,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import { createPublicKey, generateKeyPairSync } from 'crypto';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { AddressInfo } from 'net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type { AuthenticatedUser } from './../src/common/auth/authenticated-user.interface';
import { assertResourceOwnership } from './../src/common/auth/resource-ownership.util';
import { configureApp } from './../src/common/bootstrap/configure-app';
import { CurrentUser } from './../src/common/decorators/current-user.decorator';
import { UsuariosService } from './../src/usuarios/application/services/usuarios.service';
import { UsuarioResponse } from './../src/usuarios/presentation/dto/response/usuario.response';

class PrivateCreateItemDto {
  @IsString()
  nombre!: string;
}

const EXISTING_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const MISSING_USER_ID = '550e8400-e29b-41d4-a716-446655440999';
const OTHER_OWNER_ID = '660e8400-e29b-41d4-a716-446655440111';

@Controller('__auth-e2e__')
class AuthE2eTestController {
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      usrId: user.usrId,
      email: user.email,
    };
  }

  @Post('items')
  createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PrivateCreateItemDto,
  ) {
    return {
      usrId: user.usrId,
      nombre: dto.nombre,
    };
  }

  @Get('resource/:ownerUsrId')
  getOwnedResource(
    @Param('ownerUsrId') ownerUsrId: string,
    @CurrentUser('usrId') currentUsrId: string,
  ) {
    assertResourceOwnership(ownerUsrId, currentUsrId);
    return { ok: true, ownerUsrId };
  }
}

describe('HU-01.3 Validación JWT (JWKS) y Aislamiento por Usuario (e2e)', () => {
  const testSupabaseUrl = 'https://e2e-test.supabase.co';
  const expectedIssuer = `${testSupabaseUrl}/auth/v1`;
  const testKid = 'e2e-rsa-kid-1';

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const { privateKey: untrustedPrivateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  let jwksServer: http.Server;
  let app: INestApplication<App>;
  let previousJwksUrl: string | undefined;
  let previousSupabaseUrl: string | undefined;

  const signToken = (
    payload: Record<string, unknown>,
    options: jwt.SignOptions = {},
    signingKey: string = privateKey,
  ): string =>
    jwt.sign(payload, signingKey, {
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

    const mockUsuario = new UsuarioResponse();
    mockUsuario.usrId = EXISTING_USER_ID;
    mockUsuario.usrCorreo = 'ana@pockit.finance';
    mockUsuario.usrNombre = 'Ana';
    mockUsuario.usrApellido = 'García';
    mockUsuario.usrEdad = 28;
    mockUsuario.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    mockUsuario.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AuthE2eTestController],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          ...process.env,
          SUPABASE_JWKS_URL: localJwksUrl,
          SUPABASE_URL: testSupabaseUrl,
        }),
      )
      .overrideProvider(UsuariosService)
      .useValue({
        findById: jest.fn((usrId: string) =>
          Promise.resolve(usrId === EXISTING_USER_ID ? mockUsuario : null),
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    await app.init();
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

  it('GET /api/health sigue siendo público (200 OK sin token)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('rechaza ruta privada sin token con 401 y formato uniforme', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/__auth-e2e__/me')
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'TOKEN_NO_PROPORCIONADO',
      message: 'Token de autenticación requerido',
      details: null,
    });
  });

  it('rechaza token con firma inválida con 401 TOKEN_INVALIDO', async () => {
    const invalidToken = signToken(
      { sub: EXISTING_USER_ID, email: 'ana@pockit.finance' },
      {},
      untrustedPrivateKey,
    );

    const response = await request(app.getHttpServer())
      .get('/api/__auth-e2e__/me')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'TOKEN_INVALIDO',
      message: 'Token de autenticación inválido',
      details: null,
    });
  });

  it('rechaza token expirado con 401 TOKEN_EXPIRADO', async () => {
    const expiredToken = signToken(
      { sub: EXISTING_USER_ID, email: 'ana@pockit.finance' },
      { expiresIn: -30 },
    );

    const response = await request(app.getHttpServer())
      .get('/api/__auth-e2e__/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'TOKEN_EXPIRADO',
      message: 'El token de autenticación ha expirado',
      details: null,
    });
  });

  it('rechaza token válido cuyo usuario no existe en public.usuarios con 401 USUARIO_NO_REGISTRADO', async () => {
    const token = signToken({
      sub: MISSING_USER_ID,
      email: 'ghost@pockit.finance',
    });

    const response = await request(app.getHttpServer())
      .get('/api/__auth-e2e__/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'USUARIO_NO_REGISTRADO',
      message: 'El usuario autenticado no se encuentra registrado',
      details: null,
    });
  });

  it('permite acceso con token válido y usuario existente devolviendo usrId de @CurrentUser()', async () => {
    const validToken = signToken({
      sub: EXISTING_USER_ID,
      email: 'ana@pockit.finance',
    });

    const response = await request(app.getHttpServer())
      .get('/api/__auth-e2e__/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toEqual({
      usrId: EXISTING_USER_ID,
      email: 'ana@pockit.finance',
    });
  });

  it('rechaza con 400 Bad Request si se envía usr_id manualmente en un DTO protegido por ValidationPipe', async () => {
    const validToken = signToken({
      sub: EXISTING_USER_ID,
      email: 'ana@pockit.finance',
    });

    const response = await request(app.getHttpServer())
      .post('/api/__auth-e2e__/items')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        nombre: 'Cuenta Ahorros',
        usr_id: OTHER_OWNER_ID,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Error de validación',
    });
    expect((response.body as { details: string[] }).details).toEqual(
      expect.arrayContaining(['property usr_id should not exist']),
    );
  });

  it('rechaza con 403 RECURSO_NO_AUTORIZADO cuando assertResourceOwnership detecta otro propietario', async () => {
    const validToken = signToken({
      sub: EXISTING_USER_ID,
      email: 'ana@pockit.finance',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/__auth-e2e__/resource/${OTHER_OWNER_ID}`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(403);

    expect(response.body).toEqual({
      statusCode: 403,
      code: 'RECURSO_NO_AUTORIZADO',
      message: 'No tienes permisos para acceder o modificar este recurso',
      details: null,
    });
  });
});
