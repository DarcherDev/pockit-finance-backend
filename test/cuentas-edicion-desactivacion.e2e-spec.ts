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
import { UNIT_OF_WORK_PORT } from './../src/common/domain';
import type {
  CreateCuentaParams,
  CuentaModel,
  UpdateCuentaData,
} from './../src/cuentas/domain/model/cuenta.model';
import { CUENTAS_REPOSITORY_PORT } from './../src/cuentas/domain/ports/out/cuentas-repository.port';
import { UsuariosService } from './../src/usuarios/application/services/usuarios.service';
import { UsuarioResponse } from './../src/usuarios/presentation/dto/response/usuario.response';

const USER_1_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_2_ID = '660e8400-e29b-41d4-a716-446655440111';

interface MockTransaccion {
  trxCtaId: string;
  trxEstado: 'REALIZADA' | 'PENDIENTE';
}

describe('HU-03.3 Edición y Desactivación Lógica de Cuentas y Subcuentas (e2e)', () => {
  const testSupabaseUrl = 'https://e2e-cuentas-mutacion.supabase.co';
  const expectedIssuer = `${testSupabaseUrl}/auth/v1`;
  const testKid = 'e2e-cuentas-mutacion-kid-1';

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
  let transaccionesStore: MockTransaccion[];
  let sequence: number;

  const mockTx = { __isMockTx: true };
  const runInTransactionMock = jest.fn(
    async <T>(work: (tx: typeof mockTx) => Promise<T>): Promise<T> =>
      work(mockTx),
  );
  const findByIdAndUsuarioForUpdateMock = jest.fn();
  const findCuentaYSubcuentasForUpdateMock = jest.fn();

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
    transaccionesStore = [];
    sequence = 1;

    findByIdAndUsuarioForUpdateMock.mockImplementation(
      (ctaId: string, usrId: string) => {
        const found =
          store.find((c) => c.ctaId === ctaId && c.ctaUsrId === usrId) ?? null;
        return Promise.resolve(found ? { ...found } : null);
      },
    );

    findCuentaYSubcuentasForUpdateMock.mockImplementation(
      (ctaId: string, usrId: string) => {
        const rows = store
          .filter(
            (c) =>
              c.ctaUsrId === usrId &&
              (c.ctaId === ctaId || c.ctaCtaPadreId === ctaId),
          )
          .sort((a, b) => a.ctaId.localeCompare(b.ctaId))
          .map((c) => ({ ...c }));
        return Promise.resolve(rows);
      },
    );

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
      .overrideProvider(UNIT_OF_WORK_PORT)
      .useValue({
        runInTransaction: runInTransactionMock,
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
          return Promise.resolve({ ...created });
        }),
        findAllByUsuario: jest.fn(
          (usrId: string, incluirInactivas: boolean) => {
            const filtered = store
              .filter(
                (c) =>
                  c.ctaUsrId === usrId && (incluirInactivas || c.ctaActiva),
              )
              .map((c) => ({ ...c }));
            return Promise.resolve(filtered);
          },
        ),
        findByIdAndUsuario: jest.fn((ctaId: string, usrId: string) => {
          const found =
            store.find((c) => c.ctaId === ctaId && c.ctaUsrId === usrId) ??
            null;
          return Promise.resolve(found ? { ...found } : null);
        }),
        findSubcuentasByPadreId: jest.fn((padreId: string, usrId: string) => {
          const children = store
            .filter((c) => c.ctaCtaPadreId === padreId && c.ctaUsrId === usrId)
            .map((c) => ({ ...c }));
          return Promise.resolve(children);
        }),
        findByIdAndUsuarioForUpdate: findByIdAndUsuarioForUpdateMock,
        findCuentaYSubcuentasForUpdate: findCuentaYSubcuentasForUpdateMock,
        updateById: jest.fn(
          (ctaId: string, usrId: string, data: UpdateCuentaData) => {
            const index = store.findIndex(
              (c) => c.ctaId === ctaId && c.ctaUsrId === usrId,
            );
            if (index === -1) {
              return Promise.reject(new Error('Cuenta no encontrada en mock'));
            }
            const updated: CuentaModel = {
              ...store[index],
              ...data,
              ctaActualizadoEn: '2026-11-19T12:00:00.000Z',
            };
            store[index] = updated;
            return Promise.resolve({ ...updated });
          },
        ),
        contarTransaccionesPorCuentas: jest.fn((ctaIds: string[]) => {
          const matching = transaccionesStore.filter((t) =>
            ctaIds.includes(t.trxCtaId),
          );
          const total = matching.length;
          const pendientes = matching.filter(
            (t) => t.trxEstado === 'PENDIENTE',
          ).length;
          return Promise.resolve({ total, pendientes });
        }),
        desactivarCuentas: jest.fn((ctaIds: string[], usrId: string) => {
          store = store.map((c) =>
            c.ctaUsrId === usrId && ctaIds.includes(c.ctaId)
              ? {
                  ...c,
                  ctaActiva: false,
                  ctaActualizadoEn: '2026-11-19T12:00:00.000Z',
                }
              : c,
          );
          return Promise.resolve();
        }),
        deleteByIdAndUsuario: jest.fn((ctaId: string, usrId: string) => {
          store = store.filter(
            (c) =>
              !(
                c.ctaUsrId === usrId &&
                (c.ctaId === ctaId || c.ctaCtaPadreId === ctaId)
              ),
          );
          return Promise.resolve();
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    await app.init();
  });

  beforeEach(() => {
    store = [];
    transaccionesStore = [];
    sequence = 1;
    jest.clearAllMocks();
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

  const crearCuentaPrincipal = async (
    token: string,
    overrides?: Partial<{
      ctaNombre: string;
      ctaNaturaleza: 'BANCO' | 'BILLETERA';
      ctaSaldoInicial: number;
      ctaColor: string;
      ctaIcono: string;
    }>,
  ): Promise<CuentaModel> => {
    const res = await request(app.getHttpServer())
      .post('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bancolombia',
        ctaNaturaleza: 'BANCO',
        ctaSaldoInicial: 100.0,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
        ...overrides,
      })
      .expect(201);

    return res.body as CuentaModel;
  };

  const crearSubcuenta = async (
    token: string,
    padreId: string,
    overrides?: Partial<{
      ctaNombre: string;
      ctaSaldoInicial: number;
      ctaColor: string;
      ctaIcono: string;
    }>,
  ): Promise<CuentaModel> => {
    const res = await request(app.getHttpServer())
      .post(`/api/cuentas/${padreId}/subcuentas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Bolsillo Ahorro',
        ctaSaldoInicial: 50.0,
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
        ...overrides,
      })
      .expect(201);

    return res.body as CuentaModel;
  };

  it('1. PATCH /api/cuentas/:id modifica campos permitidos y ajusta ctaSaldoActual por delta de ctaSaldoInicial dentro de transacción con FOR UPDATE', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const cuenta = await crearCuentaPrincipal(token, {
      ctaSaldoInicial: 100.0,
    });

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/cuentas/${cuenta.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: '  Nequi Principal  ',
        ctaColor: '#EC4899',
        ctaIcono: 'smartphone',
        ctaNaturaleza: 'BILLETERA',
        ctaSaldoInicial: 140.0,
      })
      .expect(200);

    expect(patchRes.body).toMatchObject({
      ctaId: cuenta.ctaId,
      ctaNombre: 'Nequi Principal',
      ctaColor: '#EC4899',
      ctaIcono: 'smartphone',
      ctaNaturaleza: 'BILLETERA',
      ctaSaldoInicial: 140,
      ctaSaldoActual: 140,
      ctaActiva: true,
    });

    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(findByIdAndUsuarioForUpdateMock).toHaveBeenCalledWith(
      cuenta.ctaId,
      USER_1_ID,
      mockTx,
    );
  });

  it('2. PATCH /api/cuentas/:id rechaza ctaSaldoActual en el body con 400 Bad Request', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const cuenta = await crearCuentaPrincipal(token);

    const res = await request(app.getHttpServer())
      .patch(`/api/cuentas/${cuenta.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNombre: 'Nombre Nuevo',
        ctaSaldoActual: 99999,
      })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
    });
    expect(runInTransactionMock).not.toHaveBeenCalled();
  });

  it('3. PATCH /api/cuentas/:id sobre subcuenta enviando ctaNaturaleza retorna 422 SUBCUENTA_NO_ADMITE_NATURALEZA', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const padre = await crearCuentaPrincipal(token);
    const subcuenta = await crearSubcuenta(token, padre.ctaId);

    const res = await request(app.getHttpServer())
      .patch(`/api/cuentas/${subcuenta.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ctaNaturaleza: 'BILLETERA',
      })
      .expect(422);

    expect(res.body).toMatchObject({
      statusCode: 422,
      code: 'SUBCUENTA_NO_ADMITE_NATURALEZA',
    });
  });

  it('4. DELETE /api/cuentas/:id sin transacciones elimina físicamente la cuenta y sus subcuentas hijas (200 OK, eliminadoFisicamente: true)', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const padre = await crearCuentaPrincipal(token);
    const subcuenta = await crearSubcuenta(token, padre.ctaId);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/cuentas/${padre.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleteRes.body).toMatchObject({
      ctaId: padre.ctaId,
      eliminadoFisicamente: true,
      ctaActiva: false,
    });
    expect(typeof (deleteRes.body as { mensaje: unknown }).mensaje).toBe(
      'string',
    );

    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(findCuentaYSubcuentasForUpdateMock).toHaveBeenCalledWith(
      padre.ctaId,
      USER_1_ID,
      mockTx,
    );

    const listRes = await request(app.getHttpServer())
      .get('/api/cuentas?incluirInactivas=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes.body).toEqual([]);
    expect(store.find((c) => c.ctaId === subcuenta.ctaId)).toBeUndefined();
  });

  it('5. DELETE /api/cuentas/:id con transacciones REALIZADA desactiva lógicamente cuenta y subcuentas hijas sin borrar transacciones', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const padre = await crearCuentaPrincipal(token);
    const subcuenta = await crearSubcuenta(token, padre.ctaId);

    transaccionesStore.push({
      trxCtaId: subcuenta.ctaId,
      trxEstado: 'REALIZADA',
    });

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/cuentas/${padre.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleteRes.body).toMatchObject({
      ctaId: padre.ctaId,
      eliminadoFisicamente: false,
      ctaActiva: false,
    });

    expect(transaccionesStore).toHaveLength(1);

    const activasRes = await request(app.getHttpServer())
      .get('/api/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(activasRes.body).toEqual([]);

    const todasRes = await request(app.getHttpServer())
      .get('/api/cuentas?incluirInactivas=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const todas = todasRes.body as Array<{
      ctaId: string;
      ctaActiva: boolean;
      subcuentas: Array<{ ctaId: string; ctaActiva: boolean }>;
    }>;

    expect(todas).toHaveLength(1);
    expect(todas[0]).toMatchObject({
      ctaId: padre.ctaId,
      ctaActiva: false,
    });
    expect(todas[0].subcuentas).toHaveLength(1);
    expect(todas[0].subcuentas[0]).toMatchObject({
      ctaId: subcuenta.ctaId,
      ctaActiva: false,
    });
  });

  it('6. DELETE /api/cuentas/:id con transacciones PENDIENTE en cuenta o subcuenta hija retorna 409 CUENTA_CON_TRANSACCIONES_PENDIENTES', async () => {
    const token = signToken(USER_1_ID, 'ana@pockit.finance');
    const padre = await crearCuentaPrincipal(token);
    const subcuenta = await crearSubcuenta(token, padre.ctaId);

    transaccionesStore.push(
      {
        trxCtaId: padre.ctaId,
        trxEstado: 'REALIZADA',
      },
      {
        trxCtaId: subcuenta.ctaId,
        trxEstado: 'PENDIENTE',
      },
    );

    const res = await request(app.getHttpServer())
      .delete(`/api/cuentas/${padre.ctaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(res.body).toMatchObject({
      statusCode: 409,
      code: 'CUENTA_CON_TRANSACCIONES_PENDIENTES',
    });

    const padreEnStore = store.find((c) => c.ctaId === padre.ctaId);
    const subEnStore = store.find((c) => c.ctaId === subcuenta.ctaId);
    expect(padreEnStore?.ctaActiva).toBe(true);
    expect(subEnStore?.ctaActiva).toBe(true);
  });

  it('7. Aislamiento por usr_id: intentar editar o eliminar una cuenta de otro usuario retorna 404 CUENTA_NO_ENCONTRADA', async () => {
    const tokenUser1 = signToken(USER_1_ID, 'ana@pockit.finance');
    const tokenUser2 = signToken(USER_2_ID, 'carlos@pockit.finance');

    const cuentaUser1 = await crearCuentaPrincipal(tokenUser1);

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/cuentas/${cuentaUser1.ctaId}`)
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({
        ctaNombre: 'Intento No Autorizado',
      })
      .expect(404);

    expect(patchRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/cuentas/${cuentaUser1.ctaId}`)
      .set('Authorization', `Bearer ${tokenUser2}`)
      .expect(404);

    expect(deleteRes.body).toMatchObject({
      statusCode: 404,
      code: 'CUENTA_NO_ENCONTRADA',
    });

    const cuentaEnStore = store.find((c) => c.ctaId === cuentaUser1.ctaId);
    expect(cuentaEnStore?.ctaNombre).toBe('Bancolombia');
    expect(cuentaEnStore?.ctaActiva).toBe(true);
  });
});
