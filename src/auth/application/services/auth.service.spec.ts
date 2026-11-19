import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasService } from '../../../categorias/application/services/categorias.service';
import { DomainError, UNIT_OF_WORK_PORT } from '../../../common/domain';
import type {
  TransactionContext,
  UnitOfWorkPort,
} from '../../../common/domain';
import { UsuariosService } from '../../../usuarios/application/services/usuarios.service';
import { UsuarioResponse } from '../../../usuarios/presentation/dto/response/usuario.response';
import type {
  AuthProviderUser,
  AuthSession,
  CreateAuthUserParams,
  RefreshedAuthSession,
} from '../../domain/model/auth-session.model';
import { AUTH_PROVIDER_PORT } from '../../domain/ports/out/auth-provider.port';
import type { AuthProviderPort } from '../../domain/ports/out/auth-provider.port';
import {
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RecuperarPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
  RestablecerPasswordRequest,
} from '../../presentation/dto';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let createUserMock: jest.Mock<
    Promise<AuthProviderUser>,
    [CreateAuthUserParams]
  >;
  let deleteUserMock: jest.Mock<Promise<void>, [string]>;
  let signInWithPasswordMock: jest.Mock<Promise<AuthSession>, [string, string]>;
  let refreshSessionMock: jest.Mock<Promise<RefreshedAuthSession>, [string]>;
  let resetPasswordForEmailMock: jest.Mock<Promise<void>, [string, string]>;
  let updatePasswordWithRecoveryTokenMock: jest.Mock<
    Promise<void>,
    [string, string]
  >;
  let runInTransactionMock: jest.Mock<
    Promise<unknown>,
    [(tx: TransactionContext) => Promise<unknown>]
  >;
  let authProvider: AuthProviderPort;
  let usuariosService: jest.Mocked<
    Pick<UsuariosService, 'findByCorreo' | 'create' | 'obtenerPerfil'>
  >;
  let categoriasService: jest.Mocked<
    Pick<CategoriasService, 'crearCategoriasSistema'>
  >;
  let unitOfWork: UnitOfWorkPort;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let txContextMock: TransactionContext;

  beforeEach(async () => {
    txContextMock = {};

    createUserMock = jest.fn<
      Promise<AuthProviderUser>,
      [CreateAuthUserParams]
    >();
    deleteUserMock = jest.fn<Promise<void>, [string]>();
    signInWithPasswordMock = jest.fn<Promise<AuthSession>, [string, string]>();
    refreshSessionMock = jest.fn<Promise<RefreshedAuthSession>, [string]>();
    resetPasswordForEmailMock = jest.fn<Promise<void>, [string, string]>();
    updatePasswordWithRecoveryTokenMock = jest.fn<
      Promise<void>,
      [string, string]
    >();

    authProvider = {
      createUser: createUserMock,
      deleteUser: deleteUserMock,
      signInWithPassword: signInWithPasswordMock,
      refreshSession: refreshSessionMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updatePasswordWithRecoveryToken: updatePasswordWithRecoveryTokenMock,
    };

    usuariosService = {
      findByCorreo: jest.fn(),
      create: jest.fn(),
      obtenerPerfil: jest.fn(),
    };

    categoriasService = {
      crearCategoriasSistema: jest.fn(),
    };

    runInTransactionMock = jest.fn((work) => work(txContextMock));
    unitOfWork = {
      runInTransaction:
        runInTransactionMock as UnitOfWorkPort['runInTransaction'],
    };

    configService = {
      get: jest
        .fn()
        .mockReturnValue('http://localhost:4200/auth/nueva-password'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PROVIDER_PORT, useValue: authProvider },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: CategoriasService, useValue: categoriasService },
        { provide: UNIT_OF_WORK_PORT, useValue: unitOfWork },
        { provide: ConfigService, useValue: configService },
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

  it('registra usuario exitosamente: normaliza correo, crea en proveedor y ejecuta UnitOfWork de perfil + categorías', async () => {
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
    createUserMock.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    usuariosService.create.mockResolvedValue(expectedResponse);
    categoriasService.crearCategoriasSistema.mockResolvedValue([]);

    const result = await service.registrar(buildDto());

    expect(usuariosService.findByCorreo).toHaveBeenCalledWith(
      'ana.garcia@pockit.finance',
    );
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'ana.garcia@pockit.finance',
      password: 'Password123',
    });
    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(usuariosService.create).toHaveBeenCalledWith(
      {
        usrId: authUserId,
        usrCorreo: 'ana.garcia@pockit.finance',
        usrNombre: 'Ana',
        usrApellido: 'García',
        usrEdad: 28,
      },
      txContextMock,
    );
    expect(categoriasService.crearCategoriasSistema).toHaveBeenCalledWith(
      authUserId,
      txContextMock,
    );
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(result).toBe(expectedResponse);
  });

  it('lanza DomainError 409 CORREO_YA_REGISTRADO si el correo ya existe en public.usuarios', async () => {
    const existing = new UsuarioResponse();
    existing.usrId = '550e8400-e29b-41d4-a716-446655440000';
    existing.usrCorreo = 'ana.garcia@pockit.finance';

    usuariosService.findByCorreo.mockResolvedValue(existing);

    const promise = service.registrar(buildDto());

    await expect(promise).rejects.toBeInstanceOf(DomainError);
    await expect(promise).rejects.toMatchObject({
      code: 'CORREO_YA_REGISTRADO',
      statusCode: 409,
    });
    expect(createUserMock).not.toHaveBeenCalled();
    expect(runInTransactionMock).not.toHaveBeenCalled();
  });

  it('ejecuta compensación llamando a deleteUser cuando falla la transacción y relanza el error original', async () => {
    const authUserId = '550e8400-e29b-41d4-a716-446655440000';
    const sqlError = new Error('DB constraint failure');

    usuariosService.findByCorreo.mockResolvedValue(null);
    createUserMock.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    usuariosService.create.mockRejectedValue(sqlError);
    deleteUserMock.mockResolvedValue(undefined);

    await expect(service.registrar(buildDto())).rejects.toThrow(sqlError);

    expect(deleteUserMock).toHaveBeenCalledWith(authUserId);
  });

  it('relanza el error original de SQL incluso si falla la compensación deleteUser', async () => {
    const authUserId = '550e8400-e29b-41d4-a716-446655440000';
    const sqlError = new Error('DB constraint failure');

    usuariosService.findByCorreo.mockResolvedValue(null);
    createUserMock.mockResolvedValue({
      id: authUserId,
      email: 'ana.garcia@pockit.finance',
    });
    categoriasService.crearCategoriasSistema.mockRejectedValue(sqlError);
    deleteUserMock.mockRejectedValue(new Error('Supabase delete failed'));

    await expect(service.registrar(buildDto())).rejects.toThrow(sqlError);
    expect(deleteUserMock).toHaveBeenCalledWith(authUserId);
  });

  describe('login', () => {
    it('normaliza el correo, autentica con AuthProviderPort, consulta el perfil y retorna LoginResponse', async () => {
      const dto = new LoginRequest();
      dto.correo = '  Ana.Garcia@Pockit.Finance ';
      dto.password = 'Password123';

      const usuario = new UsuarioResponse();
      usuario.usrId = '550e8400-e29b-41d4-a716-446655440000';
      usuario.usrCorreo = 'ana.garcia@pockit.finance';
      usuario.usrNombre = 'Ana';
      usuario.usrApellido = 'García';
      usuario.usrEdad = 28;
      usuario.usrCreadoEn = '2026-11-17T10:00:00.000Z';
      usuario.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

      signInWithPasswordMock.mockResolvedValue({
        userId: usuario.usrId,
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
      });
      usuariosService.obtenerPerfil.mockResolvedValue(usuario);

      const result = await service.login(dto);

      expect(signInWithPasswordMock).toHaveBeenCalledWith(
        'ana.garcia@pockit.finance',
        'Password123',
      );
      expect(usuariosService.obtenerPerfil).toHaveBeenCalledWith(usuario.usrId);
      expect(result).toBeInstanceOf(LoginResponse);
      expect(result).toEqual({
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
        usuario,
      });
    });

    it('propaga DomainError 401 CREDENCIALES_INVALIDAS y no consulta el perfil si falla el proveedor', async () => {
      const dto = new LoginRequest();
      dto.correo = 'ana@pockit.finance';
      dto.password = 'WrongPass';

      signInWithPasswordMock.mockRejectedValue(
        new DomainError(
          'CREDENCIALES_INVALIDAS',
          'Credenciales inválidas.',
          401,
        ),
      );

      await expect(service.login(dto)).rejects.toMatchObject({
        code: 'CREDENCIALES_INVALIDAS',
        statusCode: 401,
      });
      expect(usuariosService.obtenerPerfil).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('renueva la sesión con AuthProviderPort y retorna RefreshTokenResponse', async () => {
      const dto = new RefreshTokenRequest();
      dto.refreshToken = 'old-refresh-token';

      refreshSessionMock.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      const result = await service.refresh(dto);

      expect(refreshSessionMock).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toBeInstanceOf(RefreshTokenResponse);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });
  });

  describe('recuperarPassword', () => {
    it('normaliza el correo, lee PASSWORD_RESET_REDIRECT_URL, invoca AuthProviderPort y retorna mensaje neutro', async () => {
      const dto = new RecuperarPasswordRequest();
      dto.correo = '  Ana.Garcia@Pockit.Finance  ';

      configService.get.mockReturnValue(
        'https://app.pockit.finance/auth/nueva-password',
      );
      resetPasswordForEmailMock.mockResolvedValue(undefined);

      const result = await service.recuperarPassword(dto);

      expect(configService.get).toHaveBeenCalledWith(
        'PASSWORD_RESET_REDIRECT_URL',
        'http://localhost:4200/auth/nueva-password',
      );
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        'ana.garcia@pockit.finance',
        'https://app.pockit.finance/auth/nueva-password',
      );
      expect(result).toBeInstanceOf(MensajeResponse);
      expect(result).toEqual({
        message:
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    });
  });

  describe('restablecerPassword', () => {
    it('extrae el token Bearer y actualiza la contraseña retornando MensajeResponse', async () => {
      const dto = new RestablecerPasswordRequest();
      dto.password = 'NewPassword123';

      updatePasswordWithRecoveryTokenMock.mockResolvedValue(undefined);

      const result = await service.restablecerPassword(
        'Bearer valid-recovery-token',
        dto,
      );

      expect(updatePasswordWithRecoveryTokenMock).toHaveBeenCalledWith(
        'valid-recovery-token',
        'NewPassword123',
      );
      expect(result).toBeInstanceOf(MensajeResponse);
      expect(result).toEqual({
        message: 'Contraseña restablecida correctamente.',
      });
    });

    it.each([undefined, '', 'Token abc', 'Bearer ', 'Bearer   '])(
      'lanza DomainError 401 TOKEN_RECUPERACION_INVALIDO cuando Authorization es inválido (%p)',
      async (invalidHeader) => {
        const dto = new RestablecerPasswordRequest();
        dto.password = 'NewPassword123';

        const promise = service.restablecerPassword(invalidHeader, dto);

        await expect(promise).rejects.toBeInstanceOf(DomainError);
        await expect(promise).rejects.toMatchObject({
          code: 'TOKEN_RECUPERACION_INVALIDO',
          message: 'El token de recuperación es inválido o ha expirado.',
          statusCode: 401,
        });
        expect(updatePasswordWithRecoveryTokenMock).not.toHaveBeenCalled();
      },
    );
  });
});
