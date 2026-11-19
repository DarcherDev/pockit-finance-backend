import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createPublicKey, generateKeyPairSync } from 'crypto';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { AddressInfo } from 'net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/common/bootstrap/configure-app';
import type {
  CreateCuentaParams,
  CuentaModel,
} from './../src/cuentas/domain/model/cuenta.model';
import { CUENTAS_REPOSITORY_PORT } from './../src/cuentas/domain/ports/out/cuentas-repository.port';
import { UsuariosService } from './../src/usuarios/application/services/usuarios.service';
import { UsuarioResponse } from './../src/usuarios/presentation/dto/response/usuario.response';

const USER_1_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_2_ID = '660e8400-e29b-41d4-a716-446655440111';

describe('HU-03.1 Creación y Listado Jerárquico de Cuentas Principales (e2e)', () => {
  const testSupabaseUrl = 'https://e2e-cuentas.supabase.co';
  const expectedIssuer = `${testSupabaseUrl}/auth/v1`;
  const testKid = 'e2e-cuentas-kid-1';

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  let jwksServer: http.Server;
  let app: INestApplication<App>;
  let previousJwksUrl: string | undefined;
  let previousSupabaseUrl: string | undefined;
  let store: CuentaModel[];
  let sequence: number;

  const signToken = (usrId: string, email: string): string =>
    jwt.sign({ sub: usrId, email }, privateKey, {
      algorithm: 'RS256',
      keyid: testKid,
      audience: 'authenticated',
      issuer: expectedIssuer,
      expiresIn: '1h',
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

    const buildUser = (id: string, correo: string): UsuarioResponse => {
      const u = new UsuarioResponse();
      u.usrId = id;
      u.usrCorreo = correo;
      u.usrNombre = 'Usuario';
      u.usrApellido = 'Prueba';
      u.usrEdad = 28;
      u.usrCreadoEn = '2026-11-19T10:00:00.000Z';
      u.usrActualizadoEn = '2026-11-19T10:00:00.000Z';
      return u;
    };

    const mockUsers = new Map<string, UsuarioResponse>([
      [USER_1_ID, buildUser(USER_1_ID, 'ana@pockit.finance')],
      [USER_2_ID, buildUser(USER_2_ID, 'carlos@pockit.finance')],
    ]);

    store = [];
    sequence = 1;

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
      .overrideProvider(UsuariosService)
      .useValue({
        findById: jest.fn((usrId: string) =>
          Promise.resolve(mockUsers.get(usrId) ?? null),
        ),
      })
      .overrideProvider(CUENTAS_REPOSITORY_PORT)
      .useValue({
        create: jest.fn((params: CreateCuentaParams) => {
          const created: CuentaModel = {
            ...params,
            ctaId: `00000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}`,
            ctaCreadoEn: '2026-11-19T10:00:00.000Z',
            ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
          };
          store.push(created);
          return Promise.resolve(created);
        }),
        findAllByUsuario: jest.fn(
          (usrId: string, incluirInactivas: boolean) => {
            const filtered = store.filter(
              (c) => c.ctaUsrId === usrId && (incluirInactivas || c.ctaActiva),
            );
            return Promise.resolve(filtered);
          },
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    await app.init();
  });

  beforeEach(() => {
    store = [];
    sequence = 1;
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

  it('1. Sin token retorna 401 Unauthorized', async () => {
    await request(app.getHttpServer()).get('/api/cuentas').expect(401);
    await request(app.getHttpServer())
      .post('/api/cuentas')
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'BANCO',
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(401);
  });

  it('2. Crear cuenta sin ctaNaturaleza o con valor inválido retorna 400 Bad Request', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const resMissing = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(400);

    expect(resMissing.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    const resInvalid = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'CRYPTO',
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(400);

    expect(resInvalid.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('3. Crear cuenta con ctaSaldoInicial = 150000 retorna 201 Created con ctaSaldoActual = 150000 y ctaCtaPadreId = null', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const response = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia Ahorros',
        ctaNaturaleza: 'BANCO',
        ctaSaldoInicial: 150000,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      ctaUsrId: USER_1_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia Ahorros',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
    });
  });

  it('4. GET /api/cuentas retorna únicamente cuentas del usuario autenticado con saldoPropio, saldoSubcuentas y saldoConsolidado exactos', async () => {
    const tokenUser1 = signToken(USER_1_ID, 'ana@pockit.finance');
    const tokenUser2 = signToken(USER_2_ID, 'carlos@pockit.finance');

    const createRes = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'BANCO',
        ctaSaldoInicial: 100000.1,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(201);

    const padreId = (createRes.body as { ctaId: string }).ctaId;

    // Subcuenta activa e inactiva para validar agrupación y suma exacta en centavos
    store.push(
      {
        ctaId: '00000000-0000-4000-8000-000000000091',
        ctaUsrId: USER_1_ID,
        ctaCtaPadreId: padreId,
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Vacaciones',
        ctaSaldoInicial: 25000.2,
        ctaSaldoActual: 25000.2,
        ctaColor: '#0F172A',
        ctaIcono: 'piggy-bank',
        ctaActiva: true,
        ctaCreadoEn: '2026-11-19T10:05:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
      },
      {
        ctaId: '00000000-0000-4000-8000-000000000092',
        ctaUsrId: USER_1_ID,
        ctaCtaPadreId: padreId,
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Inactivo',
        ctaSaldoInicial: 90000,
        ctaSaldoActual: 90000,
        ctaColor: '#0F172A',
        ctaIcono: 'archive',
        ctaActiva: false,
        ctaCreadoEn: '2026-11-19T10:06:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:06:00.000Z',
      },
    );

    // Cuenta de otro usuario que NO debe aparecer
    await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({
        ctaNombre: 'Nequi Carlos',
        ctaNaturaleza: 'BILLETERA',
        ctaSaldoInicial: 500000,
        ctaColor: '#7C3AED',
        ctaIcono: 'wallet',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/cuentas')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .expect(200);

    const body = listRes.body as Array<{
      ctaId: string;
      ctaUsrId: string;
      saldoPropio: number;
      saldoSubcuentas: number;
      saldoConsolidado: number;
      subcuentas: Array<{ ctaNombre: string }>;
    }>;

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      ctaId: padreId,
      ctaUsrId: USER_1_ID,
      saldoPropio: 100000.1,
      saldoSubcuentas: 25000.2,
      saldoConsolidado: 125000.3,
    });
    expect(body[0].subcuentas).toHaveLength(1);
    expect(body[0].subcuentas[0].ctaNombre).toBe('Bolsillo Vacaciones');
  });
});
