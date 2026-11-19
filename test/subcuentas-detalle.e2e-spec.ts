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

describe('HU-03.2 Creación y Detalle de Subcuentas (e2e)', () => {
  const testSupabaseUrl = 'https://e2e-subcuentas.supabase.co';
  const expectedIssuer = `${testSupabaseUrl}/auth/v1`;
  const testKid = 'e2e-subcuentas-kid-1';

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
        findByIdAndUsuario: jest.fn((ctaId: string, usrId: string) => {
          const found =
            store.find((c) => c.ctaId === ctaId && c.ctaUsrId === usrId) ??
            null;
          return Promise.resolve(found);
        }),
        findSubcuentasByPadreId: jest.fn((padreId: string, usrId: string) => {
          const children = store.filter(
            (c) => c.ctaCtaPadreId === padreId && c.ctaUsrId === usrId,
          );
          return Promise.resolve(children);
        }),
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

  it('1. Crear subcuenta bajo cuenta principal activa retorna 201 Created', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const padreRes = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'BANCO',
        ctaSaldoInicial: 100000,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(201);

    const padreId = (padreRes.body as { ctaId: string }).ctaId;

    const subRes = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo Vacaciones',
        ctaSaldoInicial: 25000.5,
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(201);

    expect(subRes.body).toMatchObject({
      ctaUsrId: USER_1_ID,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000.5,
      ctaSaldoActual: 25000.5,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
    });

    const subDefaultRes = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: '  Bolsillo Sin Saldo  ',
        ctaColor: '#10B981',
        ctaIcono: 'coins',
      })
      .expect(201);

    expect(subDefaultRes.body).toMatchObject({
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Sin Saldo',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaActiva: true,
    });
  });

  it('2. Crear subcuenta con ctaSaldoInicial < 0, payload inválido (forbidNonWhitelisted/decimales) o UUID inválido retorna 400 Bad Request', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const padreId = '00000000-0000-4000-8000-000000000010';

    const resNegative = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaSaldoInicial: -1,
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(400);

    expect(resNegative.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    const resNonWhitelisted = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaNaturaleza: 'BANCO',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(400);

    expect(resNonWhitelisted.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    const resNonNumericSaldo = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaSaldoInicial: 'no-es-numero',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(400);

    expect(resNonNumericSaldo.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/cuentas/no-es-uuid/subcuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/cuentas/no-es-uuid/detalle')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('3. Crear subcuenta sobre una cuenta que ya es subcuenta retorna 422 JERARQUIA_MAXIMA_EXCEDIDA', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const subId = '00000000-0000-4000-8000-000000000050';
    store.push({
      ctaId: subId,
      ctaUsrId: USER_1_ID,
      ctaCtaPadreId: '00000000-0000-4000-8000-000000000049',
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Hijo',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 100,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const res = await request(app.getHttpServer())
      .post(`/api/cuentas/${subId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo Nieto',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(422);

    expect(res.body).toMatchObject({
      statusCode: 422,
      code: 'JERARQUIA_MAXIMA_EXCEDIDA',
    });
  });

  it('4. Crear subcuenta sobre cuenta padre inactiva retorna 422 CUENTA_PADRE_INACTIVA', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const padreInactivoId = '00000000-0000-4000-8000-000000000060';
    store.push({
      ctaId: padreInactivoId,
      ctaUsrId: USER_1_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Cuenta Inactiva',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 100,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: false,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const res = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreInactivoId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(422);

    expect(res.body).toMatchObject({
      statusCode: 422,
      code: 'CUENTA_PADRE_INACTIVA',
    });
  });

  it('5. Crear subcuenta o consultar detalle de cuenta inexistente o de otro usuario retorna 404 CUENTA_NO_ENCONTRADA', async () => {
    const tokenUser1 = signToken(USER_1_ID, 'ana@pockit.finance');
    const cuentaUser2Id = '00000000-0000-4000-8000-000000000070';

    store.push({
      ctaId: cuentaUser2Id,
      ctaUsrId: USER_2_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BILLETERA',
      ctaNombre: 'Nequi Carlos',
      ctaSaldoInicial: 500,
      ctaSaldoActual: 500,
      ctaColor: '#7C3AED',
      ctaIcono: 'wallet',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const postOtherRes = await request(app.getHttpServer())
      .post(`/api/cuentas/${cuentaUser2Id}/subcuentas`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        ctaNombre: 'Intento Ajeno',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(404);

    expect(postOtherRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });

    const getOtherRes = await request(app.getHttpServer())
      .get(`/api/cuentas/${cuentaUser2Id}/detalle`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .expect(404);

    expect(getOtherRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });

    const nonexistentId = '00000000-0000-4000-8000-999999999999';

    const postMissingRes = await request(app.getHttpServer())
      .post(`/api/cuentas/${nonexistentId}/subcuentas`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        ctaNombre: 'Intento Inexistente',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(404);

    expect(postMissingRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });

    const getMissingRes = await request(app.getHttpServer())
      .get(`/api/cuentas/${nonexistentId}/detalle`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .expect(404);

    expect(getMissingRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });
  });

  it('6. GET /api/cuentas/:id/detalle retorna cuenta, subcuentas y saldos consolidados exactos excluyendo subcuentas inactivas', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');

    const padreRes = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'BANCO',
        ctaSaldoInicial: 100.1,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
      })
      .expect(201);

    const padreId = (padreRes.body as { ctaId: string }).ctaId;

    await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo Ahorro',
        ctaSaldoInicial: 50.2,
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(201);

    store.push({
      ctaId: '00000000-0000-4000-8000-000000000099',
      ctaUsrId: USER_1_ID,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Inactivo',
      ctaSaldoInicial: 999.99,
      ctaSaldoActual: 999.99,
      ctaColor: '#64748B',
      ctaIcono: 'archive',
      ctaActiva: false,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const detalleRes = await request(app.getHttpServer())
      .get(`/api/cuentas/${padreId}/detalle`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detalleRes.body).toMatchObject({
      ctaId: padreId,
      ctaNombre: 'Bancolombia',
      saldoPropio: 100.1,
      saldoSubcuentas: 50.2,
      saldoConsolidado: 150.3,
    });
    expect(
      (detalleRes.body as { subcuentas: unknown[] }).subcuentas,
    ).toHaveLength(2);
  });

  it('7. Endpoints de subcuentas y detalle sin token retornan 401 Unauthorized', async () => {
    const cuentaId = '00000000-0000-4000-8000-000000000010';

    await request(app.getHttpServer())
      .post(`/api/cuentas/${cuentaId}/subcuentas`)
      .send({
        ctaNombre: 'Bolsillo',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      })
      .expect(401);

    await request(app.getHttpServer())
      .get(`/api/cuentas/${cuentaId}/detalle`)
      .expect(401);
  });
});
