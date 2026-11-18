import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuariosRepository } from './usuarios.repository';

describe('UsuariosRepository', () => {
  let repository: UsuariosRepository;
  let queryBuilderMock: {
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let typeOrmRepo: jest.Mocked<
    Pick<
      Repository<UsuarioEntity>,
      'findOne' | 'createQueryBuilder' | 'create' | 'save'
    >
  >;

  beforeEach(async () => {
    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    typeOrmRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosRepository,
        {
          provide: getRepositoryToken(UsuarioEntity),
          useValue: typeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<UsuariosRepository>(UsuariosRepository);
  });

  it('findById retorna la entidad cuando existe el usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const expected = new UsuarioEntity();
    expected.usrId = usrId;
    expected.usrCorreo = 'ana@pockit.finance';
    typeOrmRepo.findOne.mockResolvedValue(expected);

    const result = await repository.findById(usrId);

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { usrId },
    });
    expect(result).toBe(expected);
  });

  it('findById retorna null cuando no existe el usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440999';
    typeOrmRepo.findOne.mockResolvedValue(null);

    const result = await repository.findById(usrId);

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { usrId },
    });
    expect(result).toBeNull();
  });

  it('findByCorreo consulta insensible a mayúsculas con LOWER y retorna la entidad', async () => {
    const expected = new UsuarioEntity();
    expected.usrId = '550e8400-e29b-41d4-a716-446655440000';
    expected.usrCorreo = 'ana@pockit.finance';
    queryBuilderMock.getOne.mockResolvedValue(expected);

    const result = await repository.findByCorreo('  Ana@Pockit.Finance ');

    expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('usuario');
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'LOWER(usuario.usrCorreo) = LOWER(:correo)',
      { correo: 'Ana@Pockit.Finance' },
    );
    expect(result).toBe(expected);
  });

  it('create crea y guarda el usuario usando el repositorio por defecto', async () => {
    const data = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
    };
    const created = Object.assign(new UsuarioEntity(), data);
    typeOrmRepo.create.mockReturnValue(created);
    typeOrmRepo.save.mockResolvedValue(created);

    const result = await repository.create(data);

    expect(typeOrmRepo.create).toHaveBeenCalledWith(data);
    expect(typeOrmRepo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  it('create usa el EntityManager transaccional cuando se proporciona', async () => {
    const data = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
    };
    const created = Object.assign(new UsuarioEntity(), data);
    const managerRepoMock = {
      create: jest.fn().mockReturnValue(created),
      save: jest.fn().mockResolvedValue(created),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    const result = await repository.create(data, managerMock);

    expect(managerMock.getRepository).toHaveBeenCalledWith(UsuarioEntity);
    expect(managerRepoMock.create).toHaveBeenCalledWith(data);
    expect(managerRepoMock.save).toHaveBeenCalledWith(created);
    expect(typeOrmRepo.save).not.toHaveBeenCalled();
    expect(result).toBe(created);
  });
});
