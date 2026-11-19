import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CuentasService } from '../../application/services/cuentas.service';
import { CreateCuentaRequest } from '../dto/request/create-cuenta.request';
import { CreateSubcuentaRequest } from '../dto/request/create-subcuenta.request';
import { ListarCuentasQueryRequest } from '../dto/request/listar-cuentas-query.request';
import { UpdateCuentaRequest } from '../dto/request/update-cuenta.request';
import { CuentaJerarquicaResponse } from '../dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../dto/response/cuenta.response';
import { DeleteCuentaResponse } from '../dto/response/delete-cuenta.response';
import { CuentasController } from './cuentas.controller';

describe('CuentasController', () => {
  let controller: CuentasController;
  let service: jest.Mocked<
    Pick<
      CuentasService,
      | 'crearCuentaPrincipal'
      | 'listarCuentas'
      | 'crearSubcuenta'
      | 'obtenerDetalleCuenta'
      | 'actualizarCuenta'
      | 'eliminarCuenta'
    >
  >;

  const authUser: AuthenticatedUser = {
    usrId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'ana@pockit.finance',
  };

  beforeEach(async () => {
    service = {
      crearCuentaPrincipal: jest.fn(),
      listarCuentas: jest.fn(),
      crearSubcuenta: jest.fn(),
      obtenerDetalleCuenta: jest.fn(),
      actualizarCuenta: jest.fn(),
      eliminarCuenta: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentasController],
      providers: [
        {
          provide: CuentasService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CuentasController>(CuentasController);
  });

  it('crear delega en CuentasService.crearCuentaPrincipal usando usrId del JWT', async () => {
    const dto: CreateCuentaRequest = {
      ctaNombre: 'Bancolombia',
      ctaNaturaleza: 'BANCO',
      ctaSaldoInicial: 150000,
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
    };

    const expected = Object.assign(new CuentaResponse(), {
      ctaId: 'cta-1',
      ctaUsrId: authUser.usrId,
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
    });

    service.crearCuentaPrincipal.mockResolvedValue(expected);

    const result = await controller.crear(authUser, dto);

    expect(service.crearCuentaPrincipal).toHaveBeenCalledWith(
      authUser.usrId,
      dto,
    );
    expect(result).toBe(expected);
  });

  it('listar delega en CuentasService.listarCuentas usando usrId del JWT e incluirInactivas', async () => {
    const query: ListarCuentasQueryRequest = { incluirInactivas: true };
    const expected: CuentaJerarquicaResponse[] = [];
    service.listarCuentas.mockResolvedValue(expected);

    const result = await controller.listar(authUser, query);

    expect(service.listarCuentas).toHaveBeenCalledWith(authUser.usrId, true);
    expect(result).toBe(expected);
  });

  it('listar usa false por defecto cuando incluirInactivas no está definido', async () => {
    const query: ListarCuentasQueryRequest = {};
    service.listarCuentas.mockResolvedValue([]);

    await controller.listar(authUser, query);

    expect(service.listarCuentas).toHaveBeenCalledWith(authUser.usrId, false);
  });

  it('crearSubcuenta delega en CuentasService.crearSubcuenta usando usrId del JWT y padreId', async () => {
    const padreId = '00000000-0000-4000-8000-000000000001';
    const dto: CreateSubcuentaRequest = {
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
    };
    const expected = Object.assign(new CuentaResponse(), {
      ctaId: 'sub-1',
      ctaUsrId: authUser.usrId,
      ctaCtaPadreId: padreId,
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo Vacaciones',
      ctaSaldoInicial: 25000,
      ctaSaldoActual: 25000,
      ctaColor: '#0EA5E9',
      ctaIcono: 'piggy-bank',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:05:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:05:00.000Z',
    });

    service.crearSubcuenta.mockResolvedValue(expected);

    const result = await controller.crearSubcuenta(authUser, padreId, dto);

    expect(service.crearSubcuenta).toHaveBeenCalledWith(
      authUser.usrId,
      padreId,
      dto,
    );
    expect(result).toBe(expected);
  });

  it('obtenerDetalle delega en CuentasService.obtenerDetalleCuenta usando usrId del JWT e id', async () => {
    const ctaId = '00000000-0000-4000-8000-000000000001';
    const expected = Object.assign(new CuentaJerarquicaResponse(), {
      ctaId,
      ctaUsrId: authUser.usrId,
      saldoPropio: 100000,
      saldoSubcuentas: 25000,
      saldoConsolidado: 125000,
      subcuentas: [],
    });

    service.obtenerDetalleCuenta.mockResolvedValue(expected);

    const result = await controller.obtenerDetalle(authUser, ctaId);

    expect(service.obtenerDetalleCuenta).toHaveBeenCalledWith(
      authUser.usrId,
      ctaId,
    );
    expect(result).toBe(expected);
  });

  it('actualizar delega en CuentasService.actualizarCuenta usando usrId del JWT, id y dto', async () => {
    const ctaId = '00000000-0000-4000-8000-000000000001';
    const dto: UpdateCuentaRequest = {
      ctaNombre: 'Bancolombia Nómina',
      ctaSaldoInicial: 140,
    };
    const expected = Object.assign(new CuentaResponse(), {
      ctaId,
      ctaUsrId: authUser.usrId,
      ctaNombre: 'Bancolombia Nómina',
      ctaSaldoInicial: 140,
      ctaSaldoActual: 190,
    });

    service.actualizarCuenta.mockResolvedValue(expected);

    const result = await controller.actualizar(authUser, ctaId, dto);

    expect(service.actualizarCuenta).toHaveBeenCalledWith(
      authUser.usrId,
      ctaId,
      dto,
    );
    expect(result).toBe(expected);
  });

  it('eliminar delega en CuentasService.eliminarCuenta usando usrId del JWT e id', async () => {
    const ctaId = '00000000-0000-4000-8000-000000000001';
    const expected = Object.assign(new DeleteCuentaResponse(), {
      ctaId,
      eliminadoFisicamente: false,
      ctaActiva: false,
      mensaje: 'Cuenta desactivada lógicamente por poseer historial contable',
    });

    service.eliminarCuenta.mockResolvedValue(expected);

    const result = await controller.eliminar(authUser, ctaId);

    expect(service.eliminarCuenta).toHaveBeenCalledWith(authUser.usrId, ctaId);
    expect(result).toBe(expected);
  });
});
