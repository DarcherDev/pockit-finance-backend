import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { CategoriasService } from '../../categorias/services/categorias.service';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { LoginRequest } from '../dto/request/login.request';
import { RecuperarPasswordRequest } from '../dto/request/recuperar-password.request';
import { RefreshTokenRequest } from '../dto/request/refresh-token.request';
import { RegistroRequest } from '../dto/request/registro.request';
import { RestablecerPasswordRequest } from '../dto/request/restablecer-password.request';
import { LoginResponse } from '../dto/response/login.response';
import { MensajeResponse } from '../dto/response/mensaje.response';
import { RefreshTokenResponse } from '../dto/response/refresh-token.response';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseAuthService: jest.Mocked<
    Pick<
      SupabaseAuthService,
      | 'createUser'
      | 'deleteUser'
      | 'signInWithPassword'
      | 'refreshSession'
      | 'resetPasswordForEmail'
      | 'updatePasswordWithRecoveryToken'
    >
  >;
  let usuariosService: jest.Mocked<
    Pick<UsuariosService, 'findByCorreo' | 'create' | 'obtenerPerfil'>
  >;
  let categoriasService: jest.Mocked<
    Pick<CategoriasService, 'crearCategoriasSistema'>
  >;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let managerMock: EntityManager;

  beforeEach(async () => {
    managerMock = {} as EntityManager;

    supabaseAuthService = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updatePasswordWithRecoveryToken: jest.fn(),
    };

    usuariosService = {
      findByCorreo: jest.fn(),
      create: jest.fn(),
      obtenerPerfil: jest.fn(),
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

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:4200/auth/nueva-password'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseAuthService, useValue: supabaseAuthService },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: CategoriasService, useValue: categoriasService },
        { provide: DataSource, useValue: dataSource },
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

  describe('login', () => {
    it('normaliza el correo, autentica en Supabase, consulta el perfil y retorna LoginResponse', async () => {
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

      supabaseAuthService.signInWithPassword.mockResolvedValue({
        userId: usuario.usrId,
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
      });
      usuariosService.obtenerPerfil.mockResolvedValue(usuario);

      const result = await service.login(dto);

      expect(supabaseAuthService.signInWithPassword).toHaveBeenCalledWith(
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

    it('propaga DomainException 401 CREDENCIALES_INVALIDAS y no consulta el perfil si falla Supabase', async () => {
      const dto = new LoginRequest();
      dto.correo = 'ana@pockit.finance';
      dto.password = 'WrongPass';

      supabaseAuthService.signInWithPassword.mockRejectedValue(
        new DomainException(
          'CREDENCIALES_INVALIDAS',
          'Credenciales inválidas.',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      await expect(service.login(dto)).rejects.toMatchObject({
        code: 'CREDENCIALES_INVALIDAS',
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(usuariosService.obtenerPerfil).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('renueva la sesión en Supabase y retorna RefreshTokenResponse', async () => {
      const dto = new RefreshTokenRequest();
      dto.refreshToken = 'old-refresh-token';

      supabaseAuthService.refreshSession.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      const result = await service.refresh(dto);

      expect(supabaseAuthService.refreshSession).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(result).toBeInstanceOf(RefreshTokenResponse);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });
  });

  describe('recuperarPassword', () => {
    it('normaliza el correo, lee PASSWORD_RESET_REDIRECT_URL, invoca SupabaseAuthService y retorna mensaje neutro', async () => {
      const dto = new RecuperarPasswordRequest();
      dto.correo = '  Ana.Garcia@Pockit.Finance  ';

      configService.get.mockReturnValue(
        'https://app.pockit.finance/auth/nueva-password',
      );
      supabaseAuthService.resetPasswordForEmail.mockResolvedValue(undefined);

      const result = await service.recuperarPassword(dto);

      expect(configService.get).toHaveBeenCalledWith(
        'PASSWORD_RESET_REDIRECT_URL',
        'http://localhost:4200/auth/nueva-password',
      );
      expect(supabaseAuthService.resetPasswordForEmail).toHaveBeenCalledWith(
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

      supabaseAuthService.updatePasswordWithRecoveryToken.mockResolvedValue(
        undefined,
      );

      const result = await service.restablecerPassword(
        'Bearer valid-recovery-token',
        dto,
      );

      expect(
        supabaseAuthService.updatePasswordWithRecoveryToken,
      ).toHaveBeenCalledWith('valid-recovery-token', 'NewPassword123');
      expect(result).toBeInstanceOf(MensajeResponse);
      expect(result).toEqual({
        message: 'Contraseña restablecida correctamente.',
      });
    });

    it.each([undefined, '', 'Token abc', 'Bearer ', 'Bearer   '])(
      'lanza DomainException 401 TOKEN_RECUPERACION_INVALIDO cuando Authorization es inválido (%p)',
      async (invalidHeader) => {
        const dto = new RestablecerPasswordRequest();
        dto.password = 'NewPassword123';

        const promise = service.restablecerPassword(invalidHeader, dto);

        await expect(promise).rejects.toBeInstanceOf(DomainException);
        await expect(promise).rejects.toMatchObject({
          code: 'TOKEN_RECUPERACION_INVALIDO',
          message: 'El token de recuperación es inválido o ha expirado.',
          status: HttpStatus.UNAUTHORIZED,
        });
        expect(
          supabaseAuthService.updatePasswordWithRecoveryToken,
        ).not.toHaveBeenCalled();
      },
    );
  });
});
