import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, EntityManager } from 'typeorm';
import { AppModule } from './../src/app.module';
import { SupabaseAuthService } from './../src/auth/services/supabase-auth.service';
import { CategoriasService } from './../src/categorias/services/categorias.service';
import { configureApp } from './../src/common/bootstrap/configure-app';
import { UsuarioResponse } from './../src/usuarios/dto/response/usuario.response';
import { UsuariosService } from './../src/usuarios/services/usuarios.service';

describe('HU-02.1 Registro de Usuario (e2e)', () => {
  let app: INestApplication<App>;
  let supabaseAuthMock: {
    createUser: jest.Mock;
    deleteUser: jest.Mock;
  };
  let usuariosServiceMock: {
    findById: jest.Mock;
    findByCorreo: jest.Mock;
    create: jest.Mock;
  };
  let categoriasServiceMock: {
    crearCategoriasSistema: jest.Mock;
  };
  let transactionSpy: jest.SpyInstance;

  const REGISTERED_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    supabaseAuthMock = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    usuariosServiceMock = {
      findById: jest.fn(),
      findByCorreo: jest.fn(),
      create: jest.fn(),
    };

    categoriasServiceMock = {
      crearCategoriasSistema: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseAuthService)
      .useValue(supabaseAuthMock)
      .overrideProvider(UsuariosService)
      .useValue(usuariosServiceMock)
      .overrideProvider(CategoriasService)
      .useValue(categoriasServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    await app.init();

    const dataSource = app.get(DataSource);
    transactionSpy = jest
      .spyOn(dataSource, 'transaction')
      .mockImplementation(async (...args: unknown[]): Promise<unknown> => {
        const cb = args[args.length - 1] as (
          manager: EntityManager,
        ) => Promise<unknown>;
        return cb({} as EntityManager);
      });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    transactionSpy.mockImplementation(
      async (...args: unknown[]): Promise<unknown> => {
        const cb = args[args.length - 1] as (
          manager: EntityManager,
        ) => Promise<unknown>;
        return cb({} as EntityManager);
      },
    );
  });

  afterAll(async () => {
    if (transactionSpy) {
      transactionSpy.mockRestore();
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/auth/registro es público y retorna 201 Created con UsuarioResponse', async () => {
    const createdUsuario = new UsuarioResponse();
    createdUsuario.usrId = REGISTERED_USER_ID;
    createdUsuario.usrCorreo = 'ana@pockit.finance';
    createdUsuario.usrNombre = 'Ana';
    createdUsuario.usrApellido = 'García';
    createdUsuario.usrEdad = 28;
    createdUsuario.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    createdUsuario.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    usuariosServiceMock.findByCorreo.mockResolvedValue(null);
    supabaseAuthMock.createUser.mockResolvedValue({
      id: REGISTERED_USER_ID,
      email: 'ana@pockit.finance',
    });
    usuariosServiceMock.create.mockResolvedValue(createdUsuario);
    categoriasServiceMock.crearCategoriasSistema.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        correo: 'Ana@Pockit.Finance',
        password: 'Password123',
        nombre: 'Ana',
        apellido: 'García',
        edad: 28,
      })
      .expect(201);

    expect(response.body).toEqual({
      usrId: REGISTERED_USER_ID,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
    expect(usuariosServiceMock.findByCorreo).toHaveBeenCalledWith(
      'ana@pockit.finance',
    );
    expect(supabaseAuthMock.createUser).toHaveBeenCalledWith({
      email: 'ana@pockit.finance',
      password: 'Password123',
    });
    expect(categoriasServiceMock.crearCategoriasSistema).toHaveBeenCalledWith(
      REGISTERED_USER_ID,
      expect.anything(),
    );
  });

  it('POST /api/auth/registro retorna 400 Bad Request para payload inválido o campos extra', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        correo: 'invalido',
        password: '123',
        nombre: '',
        edad: 150,
        extra: 'no-permitido',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Error de validación',
    });
    expect(
      Array.isArray((response.body as { details: unknown[] }).details),
    ).toBe(true);
    expect(supabaseAuthMock.createUser).not.toHaveBeenCalled();
  });

  it('POST /api/auth/registro retorna 409 Conflict CORREO_YA_REGISTRADO si el correo ya existe', async () => {
    const existingUsuario = new UsuarioResponse();
    existingUsuario.usrId = REGISTERED_USER_ID;
    existingUsuario.usrCorreo = 'ana@pockit.finance';

    usuariosServiceMock.findByCorreo.mockResolvedValue(existingUsuario);

    const response = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        correo: 'ANA@pockit.finance',
        password: 'Password123',
        nombre: 'Ana',
        apellido: 'García',
        edad: 28,
      })
      .expect(409);

    expect(response.body).toEqual({
      statusCode: 409,
      code: 'CORREO_YA_REGISTRADO',
      message: 'El correo electrónico ya se encuentra registrado',
      details: null,
    });
    expect(supabaseAuthMock.createUser).not.toHaveBeenCalled();
  });
});
