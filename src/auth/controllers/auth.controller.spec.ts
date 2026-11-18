import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RecuperarPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegistroRequest,
  RestablecerPasswordRequest,
} from '../dto';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      | 'registrar'
      | 'login'
      | 'refresh'
      | 'recuperarPassword'
      | 'restablecerPassword'
    >
  >;

  beforeEach(async () => {
    authService = {
      registrar: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      recuperarPassword: jest.fn(),
      restablecerPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('marca el endpoint registrar como @Public() y con HTTP 201 Created', () => {
    const reflector = new Reflector();
    const registrarTarget = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'registrar',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      registrarTarget,
      AuthController,
    ]);
    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      registrarTarget,
    ) as number;

    expect(isPublic).toBe(true);
    expect(httpCode).toBe(HttpStatus.CREATED);
  });

  it('registrar delega en AuthService y retorna UsuarioResponse', async () => {
    const dto = new RegistroRequest();
    dto.correo = 'ana@pockit.finance';
    dto.password = 'Password123';
    dto.nombre = 'Ana';
    dto.apellido = 'García';
    dto.edad = 28;

    const expected = new UsuarioResponse();
    expected.usrId = '550e8400-e29b-41d4-a716-446655440000';
    expected.usrCorreo = 'ana@pockit.finance';
    expected.usrNombre = 'Ana';
    expected.usrApellido = 'García';
    expected.usrEdad = 28;
    expected.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    expected.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    authService.registrar.mockResolvedValue(expected);

    const result = await controller.registrar(dto);

    expect(authService.registrar).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('marca el endpoint login como @Public() y con HTTP 200 OK', () => {
    const reflector = new Reflector();
    const loginTarget = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'login',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      loginTarget,
      AuthController,
    ]);
    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      loginTarget,
    ) as number;

    expect(isPublic).toBe(true);
    expect(httpCode).toBe(HttpStatus.OK);
  });

  it('login delega en AuthService y retorna LoginResponse', async () => {
    const dto = new LoginRequest();
    dto.correo = 'ana@pockit.finance';
    dto.password = 'Password123';

    const usuario = new UsuarioResponse();
    usuario.usrId = '550e8400-e29b-41d4-a716-446655440000';
    usuario.usrCorreo = 'ana@pockit.finance';

    const expected = new LoginResponse();
    expected.accessToken = 'jwt-access-token';
    expected.refreshToken = 'jwt-refresh-token';
    expected.expiresIn = 3600;
    expected.usuario = usuario;

    authService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('marca el endpoint refresh como @Public() y con HTTP 200 OK', () => {
    const reflector = new Reflector();
    const refreshTarget = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'refresh',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      refreshTarget,
      AuthController,
    ]);
    const httpCode = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      refreshTarget,
    ) as number;

    expect(isPublic).toBe(true);
    expect(httpCode).toBe(HttpStatus.OK);
  });

  it('refresh delega en AuthService y retorna RefreshTokenResponse', async () => {
    const dto = new RefreshTokenRequest();
    dto.refreshToken = 'valid-refresh-token';

    const expected = new RefreshTokenResponse();
    expected.accessToken = 'new-access-token';
    expected.refreshToken = 'new-refresh-token';
    expected.expiresIn = 3600;

    authService.refresh.mockResolvedValue(expected);

    const result = await controller.refresh(dto);

    expect(authService.refresh).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('marca el endpoint recuperarPassword como @Public() y con HTTP 200 OK', () => {
    const reflector = new Reflector();
    const target = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'recuperarPassword',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      target,
      AuthController,
    ]);
    const httpCode = Reflect.getMetadata(HTTP_CODE_METADATA, target) as number;

    expect(isPublic).toBe(true);
    expect(httpCode).toBe(HttpStatus.OK);
  });

  it('recuperarPassword delega en AuthService y retorna MensajeResponse', async () => {
    const dto = new RecuperarPasswordRequest();
    dto.correo = 'ana@pockit.finance';

    const expected = new MensajeResponse();
    expected.message =
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

    authService.recuperarPassword.mockResolvedValue(expected);

    const result = await controller.recuperarPassword(dto);

    expect(authService.recuperarPassword).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('marca el endpoint restablecerPassword como @Public() y con HTTP 200 OK', () => {
    const reflector = new Reflector();
    const target = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'restablecerPassword',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      target,
      AuthController,
    ]);
    const httpCode = Reflect.getMetadata(HTTP_CODE_METADATA, target) as number;

    expect(isPublic).toBe(true);
    expect(httpCode).toBe(HttpStatus.OK);
  });

  it('restablecerPassword delega en AuthService y retorna MensajeResponse', async () => {
    const dto = new RestablecerPasswordRequest();
    dto.password = 'NewPassword123';

    const expected = new MensajeResponse();
    expected.message = 'Contraseña restablecida correctamente.';

    authService.restablecerPassword.mockResolvedValue(expected);

    const result = await controller.restablecerPassword(
      'Bearer valid-recovery-token',
      dto,
    );

    expect(authService.restablecerPassword).toHaveBeenCalledWith(
      'Bearer valid-recovery-token',
      dto,
    );
    expect(result).toBe(expected);
  });
});
