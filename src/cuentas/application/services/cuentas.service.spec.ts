import { Test, TestingModule } from '@nestjs/testing';
import type { CuentaModel } from '../../domain/model/cuenta.model';
import {
  CUENTAS_REPOSITORY_PORT,
  type CuentasRepositoryPort,
} from '../../domain/ports/out/cuentas-repository.port';
import { CreateCuentaRequest } from '../../presentation/dto/request/create-cuenta.request';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';
import { CuentasMapper } from '../mappers/cuentas.mapper';
import { CuentasService } from './cuentas.service';

describe('CuentasService', () => {
  let service: CuentasService;
  let repository: jest.Mocked<CuentasRepositoryPort>;

  const USR_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAllByUsuario: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuentasService,
        CuentasMapper,
        {
          provide: CUENTAS_REPOSITORY_PORT,
          useValue: repository,
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

    repository.create.mockResolvedValue(savedModel);

    const result = await service.crearCuentaPrincipal(USR_ID, request);

    expect(repository.create).toHaveBeenCalledWith({
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

    repository.create.mockResolvedValue({
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

    expect(repository.create).toHaveBeenCalledWith(
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

    repository.findAllByUsuario.mockResolvedValue(models);

    const result = await service.listarCuentas(USR_ID, false);

    expect(repository.findAllByUsuario).toHaveBeenCalledWith(USR_ID, false);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(CuentaJerarquicaResponse);
    expect(result[0].saldoPropio).toBe(100000);
    expect(result[0].saldoSubcuentas).toBe(25000.5);
    expect(result[0].saldoConsolidado).toBe(125000.5);
    expect(result[0].subcuentas).toHaveLength(1);
  });
});
