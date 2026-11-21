import { Test, TestingModule } from '@nestjs/testing';
import { DomainError } from '../../../common/domain';
import type { TransactionContext } from '../../../common/domain';
import type {
  CreateUsuarioData,
  Usuario,
} from '../../domain/model/usuario.model';
import { USUARIOS_REPOSITORY_PORT } from '../../domain/ports/out/usuarios-repository.port';
import type { UsuariosRepositoryPort } from '../../domain/ports/out/usuarios-repository.port';
import { UsuarioResponse } from '../../presentation/dto/response/usuario.response';
import { UsuariosMapper } from '../mappers/usuarios.mapper';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let findByIdMock: jest.Mock<Promise<Usuario | null>, [string]>;
  let findByCorreoMock: jest.Mock<
    Promise<Usuario | null>,
    [string, TransactionContext?]
  >;
  let createMock: jest.Mock<
    Promise<Usuario>,
    [CreateUsuarioData, TransactionContext?]
  >;
  let repository: UsuariosRepositoryPort;

  beforeEach(async () => {
    findByIdMock = jest.fn<Promise<Usuario | null>, [string]>();
    findByCorreoMock = jest.fn<
      Promise<Usuario | null>,
      [string, TransactionContext?]
    >();
    createMock = jest.fn<
      Promise<Usuario>,
      [CreateUsuarioData, TransactionContext?]
    >();
    repository = {
      findById: findByIdMock,
      findByCorreo: findByCorreoMock,
      create: createMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        UsuariosMapper,
        {
          provide: USUARIOS_REPOSITORY_PORT,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('findById retorna UsuarioResponse cuando el usuario existe', async () => {
    const usuario: Usuario = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    };

    findByIdMock.mockResolvedValue(usuario);

    const result = await service.findById(usuario.usrId);

    expect(findByIdMock).toHaveBeenCalledWith(usuario.usrId);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).toEqual(usuario);
  });

  it('findById retorna null cuando el usuario no existe', async () => {
    findByIdMock.mockResolvedValue(null);

    const result = await service.findById(
      '550e8400-e29b-41d4-a716-446655440999',
    );

    expect(result).toBeNull();
  });

  it('findByCorreo retorna UsuarioResponse cuando existe el correo', async () => {
    const usuario: Usuario = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    };
    findByCorreoMock.mockResolvedValue(usuario);

    const result = await service.findByCorreo('ana@pockit.finance');

    expect(findByCorreoMock).toHaveBeenCalledWith(
      'ana@pockit.finance',
      undefined,
    );
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result?.usrCorreo).toBe('ana@pockit.finance');
  });

  it('findByCorreo retorna null cuando no existe el correo', async () => {
    findByCorreoMock.mockResolvedValue(null);

    const result = await service.findByCorreo('noexiste@pockit.finance');

    expect(result).toBeNull();
  });

  it('create crea el usuario con TransactionContext opcional y retorna UsuarioResponse', async () => {
    const tx = {} as TransactionContext;
    const payload = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
    };
    const domainUsuario: Usuario = {
      ...payload,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    };
    createMock.mockResolvedValue(domainUsuario);

    const result = await service.create(payload, tx);

    expect(createMock).toHaveBeenCalledWith(payload, tx);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result.usrId).toBe(payload.usrId);
  });

  it('obtenerPerfil retorna UsuarioResponse cuando el usuario existe', async () => {
    const usuario: Usuario = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    };

    findByIdMock.mockResolvedValue(usuario);

    const result = await service.obtenerPerfil(usuario.usrId);

    expect(findByIdMock).toHaveBeenCalledWith(usuario.usrId);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).toEqual(usuario);
  });

  it('obtenerPerfil lanza DomainError 404 USUARIO_NO_ENCONTRADO si el usuario no existe', async () => {
    findByIdMock.mockResolvedValue(null);

    const promise = service.obtenerPerfil(
      '550e8400-e29b-41d4-a716-446655440999',
    );

    await expect(promise).rejects.toBeInstanceOf(DomainError);
    await expect(promise).rejects.toMatchObject({
      code: 'USUARIO_NO_ENCONTRADO',
      statusCode: 404,
    });
  });
});
