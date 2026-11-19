import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import { CuentaEntity } from '../entities/cuenta.entity';
import { CuentaPersistenceMapper } from '../mappers/cuenta-persistence.mapper';
import { CuentasRepository } from './cuentas.repository';

describe('CuentasRepository', () => {
  let repository: CuentasRepository;
  let typeOrmRepo: jest.Mocked<
    Pick<Repository<CuentaEntity>, 'create' | 'save' | 'find'>
  >;

  beforeEach(async () => {
    typeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuentasRepository,
        CuentaPersistenceMapper,
        {
          provide: getRepositoryToken(CuentaEntity),
          useValue: typeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<CuentasRepository>(CuentasRepository);
  });

  it('create persiste una cuenta y retorna un CuentaModel de dominio', async () => {
    const params = {
      ctaUsrId: '550e8400-e29b-41d4-a716-446655440000',
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Cuenta Ahorros',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
    };

    const entity = Object.assign(new CuentaEntity(), {
      ...params,
      ctaId: 'cta-1',
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    typeOrmRepo.create.mockReturnValue(entity);
    typeOrmRepo.save.mockResolvedValue(entity);

    const result = await repository.create(params);

    expect(typeOrmRepo.create).toHaveBeenCalledWith(params);
    expect(typeOrmRepo.save).toHaveBeenCalledWith(entity);
    expect(result).not.toBeInstanceOf(CuentaEntity);
    expect(result.ctaId).toBe('cta-1');
    expect(result.ctaSaldoActual).toBe(150000);
  });

  it('create usa el EntityManager del TransactionContext cuando se proporciona', async () => {
    const params = {
      ctaUsrId: '550e8400-e29b-41d4-a716-446655440000',
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BILLETERA' as const,
      ctaNombre: 'Nequi',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#7C3AED',
      ctaIcono: 'wallet',
      ctaActiva: true,
    };

    const entity = Object.assign(new CuentaEntity(), {
      ...params,
      ctaId: 'cta-2',
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const managerRepoMock = {
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const getRepositoryMock = jest.fn().mockReturnValue(managerRepoMock);
    const managerMock = {
      getRepository: getRepositoryMock,
    } as unknown as EntityManager;

    const result = await repository.create(
      params,
      managerMock as unknown as TransactionContext,
    );

    expect(getRepositoryMock).toHaveBeenCalledWith(CuentaEntity);
    expect(managerRepoMock.create).toHaveBeenCalledWith(params);
    expect(managerRepoMock.save).toHaveBeenCalledWith(entity);
    expect(typeOrmRepo.save).not.toHaveBeenCalled();
    expect(result.ctaId).toBe('cta-2');
  });

  it('findAllByUsuario filtra por ctaUsrId y ctaActiva=true cuando incluirInactivas es false con orden determinístico', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const entity = Object.assign(new CuentaEntity(), {
      ctaId: 'cta-1',
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Cuenta Ahorros',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 100,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });
    typeOrmRepo.find.mockResolvedValue([entity]);

    const result = await repository.findAllByUsuario(usrId, false);

    expect(typeOrmRepo.find).toHaveBeenCalledWith({
      where: { ctaUsrId: usrId, ctaActiva: true },
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).not.toBeInstanceOf(CuentaEntity);
  });

  it('findAllByUsuario omite filtro ctaActiva cuando incluirInactivas es true', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    typeOrmRepo.find.mockResolvedValue([]);

    await repository.findAllByUsuario(usrId, true);

    expect(typeOrmRepo.find).toHaveBeenCalledWith({
      where: { ctaUsrId: usrId },
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });
  });
});
