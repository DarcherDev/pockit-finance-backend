import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RegistroRequest } from '../dto/request/registro.request';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'registrar'>>;

  beforeEach(async () => {
    authService = {
      registrar: jest.fn(),
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
});
