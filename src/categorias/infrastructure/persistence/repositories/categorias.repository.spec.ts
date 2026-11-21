import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { createTransactionContext } from '../../../../database/typeorm-unit-of-work';
import { CategoriaEntity } from '../entities/categoria.entity';
import { CategoriaPersistenceMapper } from '../mappers/categoria-persistence.mapper';
import { CategoriasRepository } from './categorias.repository';

describe('CategoriasRepository', () => {
  let repository: CategoriasRepository;
  let typeOrmRepo: jest.Mocked<
    Pick<Repository<CategoriaEntity>, 'create' | 'save'>
  >;

  beforeEach(async () => {
    typeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasRepository,
        CategoriaPersistenceMapper,
        {
          provide: getRepositoryToken(CategoriaEntity),
          useValue: typeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<CategoriasRepository>(CategoriasRepository);
  });

  it('createMany crea y guarda múltiples categorías y retorna modelos de dominio', async () => {
    const items = [
      {
        catUsrId: '550e8400-e29b-41d4-a716-446655440000',
        catNombre: 'Transferencia Saliente',
        catNaturaleza: 'GASTO' as const,
        catColor: '#64748B',
        catIcono: 'arrow-up-right',
        catEsSistema: true,
        catActiva: true,
      },
      {
        catUsrId: '550e8400-e29b-41d4-a716-446655440000',
        catNombre: 'Transferencia Entrante',
        catNaturaleza: 'INGRESO' as const,
        catColor: '#64748B',
        catIcono: 'arrow-down-left',
        catEsSistema: true,
        catActiva: true,
      },
    ];

    const entities = items.map((item) =>
      Object.assign(new CategoriaEntity(), item),
    );
    typeOrmRepo.create
      .mockReturnValueOnce(entities[0])
      .mockReturnValueOnce(entities[1]);
    typeOrmRepo.save.mockResolvedValue(entities as unknown as CategoriaEntity);

    const result = await repository.createMany(items);

    expect(typeOrmRepo.create).toHaveBeenCalledTimes(2);
    expect(typeOrmRepo.save).toHaveBeenCalledWith(entities);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toBeInstanceOf(CategoriaEntity);
    expect(result[0].catNombre).toBe('Transferencia Saliente');
  });

  it('createMany usa el EntityManager subyacente del TransactionContext cuando se proporciona', async () => {
    const items = [
      {
        catUsrId: '550e8400-e29b-41d4-a716-446655440000',
        catNombre: 'Transferencia Saliente',
        catNaturaleza: 'GASTO' as const,
        catColor: '#64748B',
        catIcono: 'arrow-up-right',
        catEsSistema: true,
        catActiva: true,
      },
    ];

    const entity = Object.assign(new CategoriaEntity(), items[0]);
    const managerRepoMock = {
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue([entity]),
    };
    const getRepositoryMock = jest.fn().mockReturnValue(managerRepoMock);
    const managerMock = {
      getRepository: getRepositoryMock,
    } as unknown as EntityManager;

    const result = await repository.createMany(
      items,
      createTransactionContext(managerMock),
    );

    expect(getRepositoryMock).toHaveBeenCalledWith(CategoriaEntity);
    expect(managerRepoMock.create).toHaveBeenCalledWith(items[0]);
    expect(managerRepoMock.save).toHaveBeenCalledWith([entity]);
    expect(typeOrmRepo.save).not.toHaveBeenCalled();
    expect(result[0]).not.toBeInstanceOf(CategoriaEntity);
    expect(result[0].catNombre).toBe('Transferencia Saliente');
  });
});
