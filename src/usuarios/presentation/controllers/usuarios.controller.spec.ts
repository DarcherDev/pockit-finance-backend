import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '../../../auth/presentation/decorators/public.decorator';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { UsuariosService } from '../../application/services/usuarios.service';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuariosController } from './usuarios.controller';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let usuariosService: jest.Mocked<Pick<UsuariosService, 'obtenerPerfil'>>;

  beforeEach(async () => {
    usuariosService = {
      obtenerPerfil: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: usuariosService,
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('no marca el endpoint me como @Public() para que quede protegido por SupabaseJwtGuard', () => {
    const reflector = new Reflector();
    const meTarget = Object.getOwnPropertyDescriptor(
      UsuariosController.prototype,
      'me',
    )?.value as object;

    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      meTarget,
      UsuariosController,
    ]);

    expect(isPublic).toBeUndefined();
  });

  it('me delega en UsuariosService.obtenerPerfil con user.usrId y retorna UsuarioResponse', async () => {
    const user: AuthenticatedUser = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'ana@pockit.finance',
    };

    const expected = new UsuarioResponse();
    expected.usrId = user.usrId;
    expected.usrCorreo = 'ana@pockit.finance';
    expected.usrNombre = 'Ana';
    expected.usrApellido = 'García';
    expected.usrEdad = 28;
    expected.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    expected.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    usuariosService.obtenerPerfil.mockResolvedValue(expected);

    const result = await controller.me(user);

    expect(usuariosService.obtenerPerfil).toHaveBeenCalledWith(user.usrId);
    expect(result).toBe(expected);
  });
});
