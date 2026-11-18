import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuariosMapper } from '../mapper/usuarios.mapper';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<
    Pick<UsuariosRepository, 'findById' | 'findByCorreo' | 'create'>
  >;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findByCorreo: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        UsuariosMapper,
        {
          provide: UsuariosRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('findById retorna UsuarioResponse cuando el usuario existe', async () => {
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    repository.findById.mockResolvedValue(entity);

    const result = await service.findById(entity.usrId);

    expect(repository.findById).toHaveBeenCalledWith(entity.usrId);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).not.toBeInstanceOf(UsuarioEntity);
    expect(result).toEqual({
      usrId: entity.usrId,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });

  it('findById retorna null cuando el usuario no existe', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await service.findById(
      '550e8400-e29b-41d4-a716-446655440999',
    );

    expect(result).toBeNull();
  });

  it('findByCorreo retorna UsuarioResponse cuando existe el correo', async () => {
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';
    repository.findByCorreo.mockResolvedValue(entity);

    const result = await service.findByCorreo('ana@pockit.finance');

    expect(repository.findByCorreo).toHaveBeenCalledWith(
      'ana@pockit.finance',
      undefined,
    );
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result?.usrCorreo).toBe('ana@pockit.finance');
  });

  it('findByCorreo retorna null cuando no existe el correo', async () => {
    repository.findByCorreo.mockResolvedValue(null);

    const result = await service.findByCorreo('noexiste@pockit.finance');

    expect(result).toBeNull();
  });

  it('create crea el usuario con EntityManager opcional y retorna UsuarioResponse', async () => {
    const manager = {} as EntityManager;
    const payload = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
    };
    const entity = Object.assign(new UsuarioEntity(), {
      ...payload,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
    repository.create.mockResolvedValue(entity);

    const result = await service.create(payload, manager);

    expect(repository.create).toHaveBeenCalledWith(payload, manager);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result.usrId).toBe(payload.usrId);
  });

  it('obtenerPerfil retorna UsuarioResponse cuando el usuario existe', async () => {
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    repository.findById.mockResolvedValue(entity);

    const result = await service.obtenerPerfil(entity.usrId);

    expect(repository.findById).toHaveBeenCalledWith(entity.usrId);
    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).toEqual({
      usrId: entity.usrId,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });

  it('obtenerPerfil lanza DomainException 404 USUARIO_NO_ENCONTRADO si el usuario no existe', async () => {
    repository.findById.mockResolvedValue(null);

    const promise = service.obtenerPerfil(
      '550e8400-e29b-41d4-a716-446655440999',
    );

    await expect(promise).rejects.toBeInstanceOf(DomainException);
    await expect(promise).rejects.toMatchObject({
      code: 'USUARIO_NO_ENCONTRADO',
      status: HttpStatus.NOT_FOUND,
    });
  });
});
