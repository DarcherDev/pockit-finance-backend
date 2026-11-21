import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { createTransactionContext } from '../../../../database/typeorm-unit-of-work';
import { CuentaEntity } from '../entities/cuenta.entity';
import { CuentaPersistenceMapper } from '../mappers/cuenta-persistence.mapper';
import { CuentasRepository } from './cuentas.repository';

describe('CuentasRepository', () => {
  let repository: CuentasRepository;
  let typeOrmRepo: jest.Mocked<
    Pick<Repository<CuentaEntity>, 'create' | 'save' | 'find' | 'findOne'>
  >;

  beforeEach(async () => {
    typeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
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
      createTransactionContext(managerMock),
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

  it('findByIdAndUsuario retorna CuentaModel cuando existe para ese usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const ctaId = 'cta-1';
    const entity = Object.assign(new CuentaEntity(), {
      ctaId,
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 100,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });
    typeOrmRepo.findOne.mockResolvedValue(entity);

    const result = await repository.findByIdAndUsuario(ctaId, usrId);

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { ctaId, ctaUsrId: usrId },
    });
    expect(result).not.toBeNull();
    expect(result).not.toBeInstanceOf(CuentaEntity);
    expect(result?.ctaId).toBe(ctaId);
  });

  it('findByIdAndUsuario retorna null cuando no existe o pertenece a otro usuario', async () => {
    typeOrmRepo.findOne.mockResolvedValue(null);

    const result = await repository.findByIdAndUsuario('cta-x', 'usr-x');

    expect(result).toBeNull();
  });

  it('findSubcuentasByPadreId consulta por ctaCtaPadreId y ctaUsrId con orden determinístico', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const padreId = 'padre-1';
    const entity = Object.assign(new CuentaEntity(), {
      ctaId: 'sub-1',
      ctaUsrId: usrId,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Viaje',
      ctaSaldoInicial: 50,
      ctaSaldoActual: 50,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:05:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
    });
    typeOrmRepo.find.mockResolvedValue([entity]);

    const result = await repository.findSubcuentasByPadreId(padreId, usrId);

    expect(typeOrmRepo.find).toHaveBeenCalledWith({
      where: { ctaCtaPadreId: padreId, ctaUsrId: usrId },
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).not.toBeInstanceOf(CuentaEntity);
    expect(result[0].ctaCtaPadreId).toBe(padreId);
  });

  it('findByIdAndUsuarioForUpdate bloquea la fila con pessimistic_write usando QueryBuilder del ctx', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const ctaId = 'cta-1';
    const entity = Object.assign(new CuentaEntity(), {
      ctaId,
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 150,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const qbMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(entity),
    };
    const managerRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    const result = await repository.findByIdAndUsuarioForUpdate(
      ctaId,
      usrId,
      createTransactionContext(managerMock),
    );

    expect(qbMock.where).toHaveBeenCalledWith('cta.cta_id = :ctaId', { ctaId });
    expect(qbMock.andWhere).toHaveBeenCalledWith('cta.cta_usr_id = :usrId', {
      usrId,
    });
    expect(qbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(result?.ctaId).toBe(ctaId);
  });

  it('findCuentaYSubcuentasForUpdate bloquea padre e hijas en orden determinístico cta_id ASC', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const ctaId = 'cta-1';
    const entity = Object.assign(new CuentaEntity(), {
      ctaId,
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 150,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const qbMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([entity]),
    };
    const managerRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    const result = await repository.findCuentaYSubcuentasForUpdate(
      ctaId,
      usrId,
      createTransactionContext(managerMock),
    );

    expect(qbMock.where).toHaveBeenCalledWith('cta.cta_usr_id = :usrId', {
      usrId,
    });
    expect(qbMock.andWhere).toHaveBeenCalledWith(
      '(cta.cta_id = :ctaId OR cta.cta_cta_padre_id = :ctaId)',
      { ctaId },
    );
    expect(qbMock.orderBy).toHaveBeenCalledWith('cta.cta_id', 'ASC');
    expect(qbMock.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(result).toHaveLength(1);
  });

  it('updateById actualiza los campos indicados y retorna el CuentaModel actualizado', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const ctaId = 'cta-1';
    const updatedEntity = Object.assign(new CuentaEntity(), {
      ctaId,
      ctaUsrId: usrId,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Nuevo Nombre',
      ctaSaldoInicial: 140,
      ctaSaldoActual: 190,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T11:00:00.000Z',
    });

    const managerRepoMock = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOneOrFail: jest.fn().mockResolvedValue(updatedEntity),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    const result = await repository.updateById(
      ctaId,
      usrId,
      { ctaNombre: 'Nuevo Nombre', ctaSaldoInicial: 140, ctaSaldoActual: 190 },
      createTransactionContext(managerMock),
    );

    expect(managerRepoMock.update).toHaveBeenCalledWith(
      { ctaId, ctaUsrId: usrId },
      { ctaNombre: 'Nuevo Nombre', ctaSaldoInicial: 140, ctaSaldoActual: 190 },
    );
    expect(managerRepoMock.findOneOrFail).toHaveBeenCalledWith({
      where: { ctaId, ctaUsrId: usrId },
    });
    expect(result.ctaNombre).toBe('Nuevo Nombre');
    expect(result.ctaSaldoActual).toBe(190);
  });

  it('contarTransaccionesPorCuentas ejecuta SQL parametrizado sobre public.transacciones', async () => {
    const queryMock = jest
      .fn()
      .mockResolvedValue([{ total: 3, pendientes: 1 }]);
    const managerMock = {
      query: queryMock,
    } as unknown as EntityManager;

    const result = await repository.contarTransaccionesPorCuentas(
      ['cta-1', 'sub-1'],
      createTransactionContext(managerMock),
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM public.transacciones'),
      [['cta-1', 'sub-1']],
    );
    expect(result).toEqual({ total: 3, pendientes: 1 });
  });

  it('desactivarCuentas marca ctaActiva=false para los ctaIds del usuario', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const managerRepoMock = {
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    await repository.desactivarCuentas(
      ['cta-1', 'sub-1'],
      usrId,
      createTransactionContext(managerMock),
    );

    expect(managerRepoMock.update).toHaveBeenCalledWith(
      { ctaUsrId: usrId, ctaId: In(['cta-1', 'sub-1']) },
      { ctaActiva: false },
    );
  });

  it('deleteByIdAndUsuario elimina físicamente la cuenta por ctaId y usrId', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const managerRepoMock = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const managerMock = {
      getRepository: jest.fn().mockReturnValue(managerRepoMock),
    } as unknown as EntityManager;

    await repository.deleteByIdAndUsuario(
      'cta-1',
      usrId,
      createTransactionContext(managerMock),
    );

    expect(managerRepoMock.delete).toHaveBeenCalledWith({
      ctaId: 'cta-1',
      ctaUsrId: usrId,
    });
  });
});
