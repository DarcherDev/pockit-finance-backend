import type {
  CuentaConSaldosModel,
  CuentaModel,
} from '../../domain/model/cuenta.model';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';
import { CuentasMapper } from './cuentas.mapper';

describe('CuentasMapper', () => {
  let mapper: CuentasMapper;

  beforeEach(() => {
    mapper = new CuentasMapper();
  });

  const baseModel: CuentaModel = {
    ctaId: 'cta-1',
    ctaUsrId: 'usr-1',
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

  it('toResponse convierte un CuentaModel en CuentaResponse', () => {
    const response = mapper.toResponse(baseModel);

    expect(response).toBeInstanceOf(CuentaResponse);
    expect(response).toEqual(baseModel);
  });

  it('toJerarquicaResponse convierte un CuentaConSaldosModel en CuentaJerarquicaResponse con subcuentas mapeadas', () => {
    const subModel: CuentaModel = {
      ...baseModel,
      ctaId: 'sub-1',
      ctaCtaPadreId: 'cta-1',
      ctaNaturaleza: null,
      ctaNombre: 'Bolsillo',
      ctaSaldoInicial: 50000,
      ctaSaldoActual: 50000,
    };

    const jerarquicaModel: CuentaConSaldosModel = {
      ...baseModel,
      saldoPropio: 150000,
      saldoSubcuentas: 50000,
      saldoConsolidado: 200000,
      subcuentas: [subModel],
    };

    const response = mapper.toJerarquicaResponse(jerarquicaModel);

    expect(response).toBeInstanceOf(CuentaJerarquicaResponse);
    expect(response.saldoPropio).toBe(150000);
    expect(response.saldoSubcuentas).toBe(50000);
    expect(response.saldoConsolidado).toBe(200000);
    expect(response.subcuentas).toHaveLength(1);
    expect(response.subcuentas[0]).toBeInstanceOf(CuentaResponse);
    expect(response.subcuentas[0].ctaId).toBe('sub-1');
  });
});
