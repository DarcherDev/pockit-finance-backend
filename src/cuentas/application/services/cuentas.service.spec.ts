import { Test, TestingModule } from '@nestjs/testing';
import {
  type TransactionContext,
  UNIT_OF_WORK_PORT,
  type UnitOfWorkPort,
} from '../../../common/domain';
import { DomainException } from '../../../common/exceptions/domain.exception';
import type { CuentaModel } from '../../domain/model/cuenta.model';
import {
  CUENTAS_REPOSITORY_PORT,
  type CuentasRepositoryPort,
} from '../../domain/ports/out/cuentas-repository.port';
import { CreateCuentaRequest } from '../../presentation/dto/request/create-cuenta.request';
import { CreateSubcuentaRequest } from '../../presentation/dto/request/create-subcuenta.request';
import { UpdateCuentaRequest } from '../../presentation/dto/request/update-cuenta.request';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';
import { DeleteCuentaResponse } from '../../presentation/dto/response/delete-cuenta.response';
import { CuentasMapper } from '../mappers/cuentas.mapper';
import { CuentasService } from './cuentas.service';

describe('CuentasService', () => {
  let service: CuentasService;
  let createMock: jest.Mock;
  let findAllByUsuarioMock: jest.Mock;
  let findByIdAndUsuarioMock: jest.Mock;
  let findSubcuentasByPadreIdMock: jest.Mock;
  let findByIdAndUsuarioForUpdateMock: jest.Mock;
  let findCuentaYSubcuentasForUpdateMock: jest.Mock;
  let updateByIdMock: jest.Mock;
  let contarTransaccionesPorCuentasMock: jest.Mock;
  let desactivarCuentasMock: jest.Mock;
  let deleteByIdAndUsuarioMock: jest.Mock;
  let runInTransactionMock: jest.Mock;

  const USR_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TX_MOCK = { __tx: 'mock' } as unknown as TransactionContext;

  beforeEach(async () => {
    createMock = jest.fn();
    findAllByUsuarioMock = jest.fn();
    findByIdAndUsuarioMock = jest.fn();
    findSubcuentasByPadreIdMock = jest.fn();
    findByIdAndUsuarioForUpdateMock = jest.fn();
    findCuentaYSubcuentasForUpdateMock = jest.fn();
    updateByIdMock = jest.fn();
    contarTransaccionesPorCuentasMock = jest.fn();
    desactivarCuentasMock = jest.fn();
    deleteByIdAndUsuarioMock = jest.fn();
    runInTransactionMock = jest.fn(
      <T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> =>
        work(TX_MOCK),
    );

    const repository: jest.Mocked<CuentasRepositoryPort> = {
      create: createMock,
      findAllByUsuario: findAllByUsuarioMock,
      findByIdAndUsuario: findByIdAndUsuarioMock,
      findSubcuentasByPadreId: findSubcuentasByPadreIdMock,
      findByIdAndUsuarioForUpdate: findByIdAndUsuarioForUpdateMock,
      findCuentaYSubcuentasForUpdate: findCuentaYSubcuentasForUpdateMock,
      updateById: updateByIdMock,
      contarTransaccionesPorCuentas: contarTransaccionesPorCuentasMock,
      desactivarCuentas: desactivarCuentasMock,
      deleteByIdAndUsuario: deleteByIdAndUsuarioMock,
    };

    const unitOfWork: jest.Mocked<UnitOfWorkPort> = {
      runInTransaction: runInTransactionMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuentasService,
        CuentasMapper,
        {
          provide: CUENTAS_REPOSITORY_PORT,
          useValue: repository,
        },
        {
          provide: UNIT_OF_WORK_PORT,
          useValue: unitOfWork,
        },
      ],
    }).compile();

    service = module.get<CuentasService>(CuentasService);
  });

  it('crearCuentaPrincipal fuerza usrId, ctaCtaPadreId=null, ctaSaldoActual=ctaSaldoInicial y ctaActiva=true', async () => {
    const request: CreateCuentaRequest = {
      ctaNombre: 'Bancolombia',
      ctaNaturaleza: 'BANCO',
      ctaSaldoInicial: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
    };

    const savedModel: CuentaModel = {
      ctaId: 'cta-1',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    };

    createMock.mockResolvedValue(savedModel);

    const result = await service.crearCuentaPrincipal(USR_ID, request);

    expect(createMock).toHaveBeenCalledWith({
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
    });
    expect(result).toBeInstanceOf(CuentaResponse);
    expect(result.ctaSaldoActual).toBe(150000);
    expect(result.ctaCtaPadreId).toBeNull();
  });

  it('crearCuentaPrincipal asigna 0 cuando ctaSaldoInicial no se envía', async () => {
    const request: CreateCuentaRequest = {
      ctaNombre: 'Nequi',
      ctaNaturaleza: 'BILLETERA',
      ctaColor: '#7C3AED',
      ctaIcono: 'wallet',
    };

    createMock.mockResolvedValue({
      ctaId: 'cta-2',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BILLETERA',
      ctaNombre: 'Nequi',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#7C3AED',
      ctaIcono: 'wallet',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    await service.crearCuentaPrincipal(USR_ID, request);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ctaSaldoInicial: 0,
        ctaSaldoActual: 0,
      }),
    );
  });

  it('listarCuentas retorna CuentaJerarquicaResponse[] agrupado con saldos exactos', async () => {
    const models: CuentaModel[] = [
      {
        ctaId: 'padre-1',
        ctaUsrId: USR_ID,
        ctaCtaPadreId: null,
        ctaNaturaleza: 'BANCO',
        ctaNombre: 'Bancolombia',
        ctaSaldoInicial: 100000,
        ctaSaldoActual: 100000,
        ctaColor: '#0F172A',
        ctaIcono: 'landmark',
        ctaActiva: true,
        ctaCreadoEn: '2026-11-19T10:00:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
      },
      {
        ctaId: 'sub-1',
        ctaUsrId: USR_ID,
        ctaCtaPadreId: 'padre-1',
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo',
        ctaSaldoInicial: 25000.5,
        ctaSaldoActual: 25000.5,
        ctaColor: '#0F172A',
        ctaIcono: 'piggy-bank',
        ctaActiva: true,
        ctaCreadoEn: '2026-11-19T10:05:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
      },
    ];

    findAllByUsuarioMock.mockResolvedValue(models);

    const result = await service.listarCuentas(USR_ID, false);

    expect(findAllByUsuarioMock).toHaveBeenCalledWith(USR_ID, false);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(CuentaJerarquicaResponse);
    expect(result[0].saldoPropio).toBe(100000);
    expect(result[0].saldoSubcuentas).toBe(25000.5);
    expect(result[0].saldoConsolidado).toBe(125000.5);
    expect(result[0].subcuentas).toHaveLength(1);
  });

  it('crearSubcuenta crea una subcuenta con ctaNaturaleza=null, ctaCtaPadreId=padreId y ctaSaldoActual=ctaSaldoInicial', async () => {
    const padreId = '00000000-0000-4000-8000-000000000001';
    const padre: CuentaModel = {
      ctaId: padreId,
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100000,
      ctaSaldoActual: 100000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    };
    const dto: CreateSubcuentaRequest = {
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000.5,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
    };
    const createdSubcuenta: CuentaModel = {
      ctaId: '00000000-0000-4000-8000-000000000002',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000.5,
      ctaSaldoActual: 25000.5,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:05:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
    };

    findByIdAndUsuarioMock.mockResolvedValue(padre);
    createMock.mockResolvedValue(createdSubcuenta);

    const result = await service.crearSubcuenta(USR_ID, padreId, dto);

    expect(findByIdAndUsuarioMock).toHaveBeenCalledWith(padreId, USR_ID);
    expect(createMock).toHaveBeenCalledWith({
      ctaUsrId: USR_ID,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000.5,
      ctaSaldoActual: 25000.5,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
    });
    expect(result).toBeInstanceOf(CuentaResponse);
    expect(result.ctaCtaPadreId).toBe(padreId);
    expect(result.ctaNaturaleza).toBeNull();
    expect(result.ctaSaldoActual).toBe(25000.5);
  });

  it('crearSubcuenta asigna 0 cuando ctaSaldoInicial no se envía', async () => {
    const padreId = '00000000-0000-4000-8000-000000000001';
    findByIdAndUsuarioMock.mockResolvedValue({
      ctaId: padreId,
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });
    createMock.mockResolvedValue({
      ctaId: 'sub-2',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Cero',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:05:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
    });

    await service.crearSubcuenta(USR_ID, padreId, {
      ctaNombre: 'Bolsillo Cero',
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ctaSaldoInicial: 0,
        ctaSaldoActual: 0,
      }),
    );
  });

  it('crearSubcuenta lanza DomainException 404 CUENTA_NO_ENCONTRADA cuando el padre no existe', async () => {
    findByIdAndUsuarioMock.mockResolvedValue(null);

    await expect(
      service.crearSubcuenta(USR_ID, 'no-existe', {
        ctaNombre: 'Bolsillo',
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
      }),
    ).rejects.toMatchObject({
      code: 'CUENTA_NO_ENCONTRADA',
      status: 404,
    });
  });

  it('crearSubcuenta lanza DomainException 422 JERARQUIA_MAXIMA_EXCEDIDA si el padre ya es subcuenta', async () => {
    findByIdAndUsuarioMock.mockResolvedValue({
      ctaId: 'sub-1',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: 'padre-1',
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const promise = service.crearSubcuenta(USR_ID, 'sub-1', {
      ctaNombre: 'Nieto',
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
    });

    await expect(promise).rejects.toBeInstanceOf(DomainException);
    await expect(promise).rejects.toMatchObject({
      code: 'JERARQUIA_MAXIMA_EXCEDIDA',
      status: 422,
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('crearSubcuenta lanza DomainException 422 CUENTA_PADRE_INACTIVA si la cuenta padre está inactiva', async () => {
    findByIdAndUsuarioMock.mockResolvedValue({
      ctaId: 'padre-inactivo',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 0,
      ctaSaldoActual: 0,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: false,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const promise = service.crearSubcuenta(USR_ID, 'padre-inactivo', {
      ctaNombre: 'Bolsillo',
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
    });

    await expect(promise).rejects.toBeInstanceOf(DomainException);
    await expect(promise).rejects.toMatchObject({
      code: 'CUENTA_PADRE_INACTIVA',
      status: 422,
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('obtenerDetalleCuenta retorna CuentaJerarquicaResponse con subcuentas y saldos exactos', async () => {
    const ctaId = 'padre-1';
    findByIdAndUsuarioMock.mockResolvedValue({
      ctaId,
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 100.1,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });
    findSubcuentasByPadreIdMock.mockResolvedValue([
      {
        ctaId: 'sub-1',
        ctaUsrId: USR_ID,
        ctaCtaPadreId: ctaId,
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Activo',
        ctaSaldoInicial: 20.2,
        ctaSaldoActual: 20.2,
        ctaColor: '#0EA5E9',
        ctaIcono: 'piggy-bank',
        ctaActiva: true,
        ctaCreadoEn: '2026-11-19T10:05:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
      },
      {
        ctaId: 'sub-2',
        ctaUsrId: USR_ID,
        ctaCtaPadreId: ctaId,
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Inactivo',
        ctaSaldoInicial: 999,
        ctaSaldoActual: 999,
        ctaColor: '#0EA5E9',
        ctaIcono: 'archive',
        ctaActiva: false,
        ctaCreadoEn: '2026-11-19T10:06:00.000Z',
        ctaActualizadoEn: '2026-11-19T10:06:00.000Z',
      },
    ]);

    const result = await service.obtenerDetalleCuenta(USR_ID, ctaId);

    expect(findByIdAndUsuarioMock).toHaveBeenCalledWith(ctaId, USR_ID);
    expect(findSubcuentasByPadreIdMock).toHaveBeenCalledWith(ctaId, USR_ID);
    expect(result).toBeInstanceOf(CuentaJerarquicaResponse);
    expect(result.saldoPropio).toBe(100.1);
    expect(result.saldoSubcuentas).toBe(20.2);
    expect(result.saldoConsolidado).toBe(120.3);
    expect(result.subcuentas).toHaveLength(2);
  });

  it('obtenerDetalleCuenta lanza DomainException 404 CUENTA_NO_ENCONTRADA si no existe o pertenece a otro usuario', async () => {
    findByIdAndUsuarioMock.mockResolvedValue(null);

    await expect(
      service.obtenerDetalleCuenta(USR_ID, 'no-existe'),
    ).rejects.toMatchObject({
      code: 'CUENTA_NO_ENCONTRADA',
      status: 404,
    });
    expect(findSubcuentasByPadreIdMock).not.toHaveBeenCalled();
  });

  it('actualizarCuenta recalcula ctaSaldoActual cuando cambia ctaSaldoInicial dentro de transacción FOR UPDATE', async () => {
    const ctaId = 'cta-1';
    const cuentaActual: CuentaModel = {
      ctaId,
      ctaUsrId: USR_ID,
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 100,
      ctaSaldoActual: 150,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    };
    const cuentaActualizada: CuentaModel = {
      ...cuentaActual,
      ctaNombre: 'Bancolombia Nómina',
      ctaSaldoInicial: 140,
      ctaSaldoActual: 190,
    };

    findByIdAndUsuarioForUpdateMock.mockResolvedValue(cuentaActual);
    updateByIdMock.mockResolvedValue(cuentaActualizada);

    const dto: UpdateCuentaRequest = {
      ctaNombre: 'Bancolombia Nómina',
      ctaSaldoInicial: 140,
    };

    const result = await service.actualizarCuenta(USR_ID, ctaId, dto);

    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(findByIdAndUsuarioForUpdateMock).toHaveBeenCalledWith(
      ctaId,
      USR_ID,
      TX_MOCK,
    );
    expect(updateByIdMock).toHaveBeenCalledWith(
      ctaId,
      USR_ID,
      {
        ctaNombre: 'Bancolombia Nómina',
        ctaSaldoInicial: 140,
        ctaSaldoActual: 190,
      },
      TX_MOCK,
    );
    expect(result).toBeInstanceOf(CuentaResponse);
    expect(result.ctaSaldoActual).toBe(190);
  });

  it('actualizarCuenta lanza 404 CUENTA_NO_ENCONTRADA si no existe o es de otro usuario', async () => {
    findByIdAndUsuarioForUpdateMock.mockResolvedValue(null);

    await expect(
      service.actualizarCuenta(USR_ID, 'cta-otro', { ctaNombre: 'X' }),
    ).rejects.toMatchObject({
      code: 'CUENTA_NO_ENCONTRADA',
      status: 404,
    });
    expect(updateByIdMock).not.toHaveBeenCalled();
  });

  it('actualizarCuenta lanza 422 SUBCUENTA_NO_ADMITE_NATURALEZA si se envía ctaNaturaleza en una subcuenta', async () => {
    const subcuenta: CuentaModel = {
      ctaId: 'sub-1',
      ctaUsrId: USR_ID,
      ctaCtaPadreId: 'cta-padre',
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo',
      ctaSaldoInicial: 50,
      ctaSaldoActual: 50,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    };
    findByIdAndUsuarioForUpdateMock.mockResolvedValue(subcuenta);

    await expect(
      service.actualizarCuenta(USR_ID, 'sub-1', { ctaNaturaleza: 'BANCO' }),
    ).rejects.toMatchObject({
      code: 'SUBCUENTA_NO_ADMITE_NATURALEZA',
      status: 422,
    });
    expect(updateByIdMock).not.toHaveBeenCalled();
  });

  it('eliminarCuenta lanza 404 CUENTA_NO_ENCONTRADA si no existe o es de otro usuario', async () => {
    findCuentaYSubcuentasForUpdateMock.mockResolvedValue([]);

    await expect(
      service.eliminarCuenta(USR_ID, 'no-existe'),
    ).rejects.toMatchObject({
      code: 'CUENTA_NO_ENCONTRADA',
      status: 404,
    });
    expect(contarTransaccionesPorCuentasMock).not.toHaveBeenCalled();
  });

  it('eliminarCuenta lanza 409 CUENTA_CON_TRANSACCIONES_PENDIENTES si hay transacciones PENDIENTE', async () => {
    findCuentaYSubcuentasForUpdateMock.mockResolvedValue([
      { ctaId: 'cta-1' } as CuentaModel,
      { ctaId: 'sub-1' } as CuentaModel,
    ]);
    contarTransaccionesPorCuentasMock.mockResolvedValue({
      total: 3,
      pendientes: 1,
    });

    await expect(service.eliminarCuenta(USR_ID, 'cta-1')).rejects.toMatchObject(
      {
        code: 'CUENTA_CON_TRANSACCIONES_PENDIENTES',
        status: 409,
      },
    );
    expect(desactivarCuentasMock).not.toHaveBeenCalled();
    expect(deleteByIdAndUsuarioMock).not.toHaveBeenCalled();
  });

  it('eliminarCuenta desactiva lógicamente cuenta y subcuentas cuando total > 0 y pendientes === 0', async () => {
    findCuentaYSubcuentasForUpdateMock.mockResolvedValue([
      { ctaId: 'cta-1' } as CuentaModel,
      { ctaId: 'sub-1' } as CuentaModel,
    ]);
    contarTransaccionesPorCuentasMock.mockResolvedValue({
      total: 2,
      pendientes: 0,
    });

    const result = await service.eliminarCuenta(USR_ID, 'cta-1');

    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(contarTransaccionesPorCuentasMock).toHaveBeenCalledWith(
      ['cta-1', 'sub-1'],
      TX_MOCK,
    );
    expect(desactivarCuentasMock).toHaveBeenCalledWith(
      ['cta-1', 'sub-1'],
      USR_ID,
      TX_MOCK,
    );
    expect(deleteByIdAndUsuarioMock).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(DeleteCuentaResponse);
    expect(result).toEqual({
      ctaId: 'cta-1',
      eliminadoFisicamente: false,
      ctaActiva: false,
      mensaje: 'Cuenta desactivada lógicamente por poseer historial contable',
    });
  });

  it('eliminarCuenta elimina físicamente cuando total === 0', async () => {
    findCuentaYSubcuentasForUpdateMock.mockResolvedValue([
      { ctaId: 'cta-1' } as CuentaModel,
    ]);
    contarTransaccionesPorCuentasMock.mockResolvedValue({
      total: 0,
      pendientes: 0,
    });

    const result = await service.eliminarCuenta(USR_ID, 'cta-1');

    expect(deleteByIdAndUsuarioMock).toHaveBeenCalledWith(
      'cta-1',
      USR_ID,
      TX_MOCK,
    );
    expect(desactivarCuentasMock).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(DeleteCuentaResponse);
    expect(result).toEqual({
      ctaId: 'cta-1',
      eliminadoFisicamente: true,
      ctaActiva: false,
      mensaje: 'Cuenta eliminada definitivamente',
    });
  });
});
