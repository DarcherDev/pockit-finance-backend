import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CuentasService } from '../../application/services/cuentas.service';
import { CreateCuentaRequest } from '../dto/request/create-cuenta.request';
import { ListarCuentasQueryRequest } from '../dto/request/listar-cuentas-query.request';
import { CuentaJerarquicaResponse } from '../dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../dto/response/cuenta.response';
import { CuentasController } from './cuentas.controller';

describe('CuentasController', () => {
  let controller: CuentasController;
  let service: jest.Mocked<
    Pick<CuentasService, 'crearCuentaPrincipal' | 'listarCuentas'>
  >;

  const authUser: AuthenticatedUser = {
    usrId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'ana@pockit.finance',
  };

  beforeEach(async () => {
    service = {
      crearCuentaPrincipal: jest.fn(),
      listarCuentas: jest.fn(),
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
});
