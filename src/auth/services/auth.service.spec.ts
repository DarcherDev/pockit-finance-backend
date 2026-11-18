import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { CategoriasService } from '../../categorias/services/categorias.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { RegistroRequest } from '../dto/request/registro.request';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseAuthService: jest.Mocked<
    Pick<SupabaseAuthService, 'createUser' | 'deleteUser'>
  >;
  let usuariosService: jest.Mocked<
    Pick<UsuariosService, 'findByCorreo' | 'create'>
  >;
  let categoriasService: jest.Mocked<
    Pick<CategoriasService, 'crearCategoriasSistema'>
  >;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let managerMock: EntityManager;

  beforeEach(async () => {
    managerMock = {} as EntityManager;

    supabaseAuthService = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    usuariosService = {
      findByCorreo: jest.fn(),
      create: jest.fn(),
    };

    categoriasService = {
      crearCategoriasSistema: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn((cb: (manager: EntityManager) => unknown) =>
        Promise.resolve(cb(managerMock)),
      ) as unknown as jest.Mocked<
        Pick<DataSource, 'transaction'>
      >['transaction'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseAuthService, useValue: supabaseAuthService },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: CategoriasService, useValue: categoriasService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const buildDto = (): RegistroRequest => {
    const dto = new RegistroRequest();
    dto.correo = '  Ana.Garcia@Pockit.Finance  ';
    dto.password = 'Password123';
    dto.nombre = 'Ana';
    dto.apellido = 'García';
    dto.edad = 28;
    return dto;
  };

  it('registra usuario exitosamente: normaliza correo, crea en Supabase y ejecuta transacción SQL de perfil + categorías', async () => {
    const authUserId = '550e8400-e29b-41d4-a716-446655440000';
    const expectedResponse = new UsuarioResponse();
    expectedResponse.usrId = authUserId;
    expectedResponse.usrCorreo = 'ana.garcia@pockit.finance';
    expectedResponse.usrNombre = 'Ana';
    expectedResponse.usrApellido = 'García';
    expectedResponse.usrEdad = 28;
    expectedResponse.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    expectedResponse.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    usuariosService.findByCorreo.mockResolvedValue(null);
    supabaseAuthService.createUser.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    usuariosService.create.mockResolvedValue(expectedResponse);
    categoriasService.crearCategoriasSistema.mockResolvedValue([]);

    const result = await service.registrar(buildDto());

    expect(usuariosService.findByCorreo).toHaveBeenCalledWith(
      'ana.garcia@pockit.finance',
    );
    expect(supabaseAuthService.createUser).toHaveBeenCalledWith({
      email: 'ana.garcia@pockit.finance',
      password: 'Password123',
    });
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(usuariosService.create).toHaveBeenCalledWith(
      {
        usrId: authUserId,
        usrCorreo: 'ana.garcia@pockit.finance',
        usrNombre: 'Ana',
        usrApellido: 'García',
        usrEdad: 28,
      },
      managerMock,
    );
    expect(categoriasService.crearCategoriasSistema).toHaveBeenCalledWith(
      authUserId,
      managerMock,
    );
    expect(supabaseAuthService.deleteUser).not.toHaveBeenCalled();
    expect(result).toBe(expectedResponse);
  });

  it('lanza DomainException 409 CORREO_YA_REGISTRADO si el correo ya existe en public.usuarios', async () => {
    const existing = new UsuarioResponse();
    existing.usrId = '550e8400-e29b-41d4-a716-446655440000';
    existing.usrCorreo = 'ana.garcia@pockit.finance';

    usuariosService.findByCorreo.mockResolvedValue(existing);

    const promise = service.registrar(buildDto());

    await expect(promise).rejects.toBeInstanceOf(DomainException);
    await expect(promise).rejects.toMatchObject({
      code: 'CORREO_YA_REGISTRADO',
      status: HttpStatus.CONFLICT,
    });
    expect(supabaseAuthService.createUser).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('ejecuta compensación llamando a deleteUser cuando falla la transacción SQL y relanza el error original', async () => {
    const authUserId = '550e8400-e29b-41d4-a716-446655440000';
    const sqlError = new Error('DB constraint failure');

    usuariosService.findByCorreo.mockResolvedValue(null);
    supabaseAuthService.createUser.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    usuariosService.create.mockRejectedValue(sqlError);
    supabaseAuthService.deleteUser.mockResolvedValue(undefined);

    await expect(service.registrar(buildDto())).rejects.toThrow(sqlError);

    expect(supabaseAuthService.deleteUser).toHaveBeenCalledWith(authUserId);
  });

  it('relanza el error original de SQL incluso si falla la compensación deleteUser', async () => {
    const authUserId = '550e8400-e29b-41d4-a716-446655440000';
    const sqlError = new Error('DB constraint failure');

    usuariosService.findByCorreo.mockResolvedValue(null);
    supabaseAuthService.createUser.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    categoriasService.crearCategoriasSistema.mockRejectedValue(sqlError);
    supabaseAuthService.deleteUser.mockRejectedValue(
      new Error('Supabase delete failed'),
    );

    await expect(service.registrar(buildDto())).rejects.toThrow(sqlError);
    expect(supabaseAuthService.deleteUser).toHaveBeenCalledWith(authUserId);
  });
});
