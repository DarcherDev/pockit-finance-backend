import type { CuentaModel } from '../model/cuenta.model';
import {
  construirDetalleCuenta,
  construirJerarquiaCuentas,
} from './cuentas-balance.rules';

const USR_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildCuenta = (overrides: Partial<CuentaModel>): CuentaModel => ({
  ctaId: 'cta-default',
  ctaUsrId: USR_ID,
  ctaCtaPadreId: null,
  ctaNaturaleza: 'BANCO',
  ctaNombre: 'Cuenta Principal',
  ctaSaldoInicial: 0,
  ctaSaldoActual: 0,
  ctaColor: '#0F172A',
  ctaIcono: 'landmark',
  ctaActiva: true,
  ctaCreadoEn: '2026-11-19T10:00:00.000Z',
  ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
  ...overrides,
});

describe('construirJerarquiaCuentas', () => {
  it('agrupa subcuentas activas bajo su cuenta padre y calcula saldos exactos en centavos', () => {
    const cuentas: CuentaModel[] = [
      buildCuenta({
        ctaId: 'padre-1',
        ctaNombre: 'Bancolombia',
        ctaSaldoInicial: 0.1,
        ctaSaldoActual: 0.1,
      }),
      buildCuenta({
        ctaId: 'sub-1',
        ctaCtaPadreId: 'padre-1',
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Ahorro',
        ctaSaldoInicial: 0.2,
        ctaSaldoActual: 0.2,
      }),
      buildCuenta({
        ctaId: 'sub-2',
        ctaCtaPadreId: 'padre-1',
        ctaNaturaleza: null,
        ctaNombre: 'Bolsillo Viaje',
        ctaSaldoInicial: 100.35,
        ctaSaldoActual: 100.35,
      }),
    ];

    const result = construirJerarquiaCuentas(cuentas, false);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ctaId: 'padre-1',
      saldoPropio: 0.1,
      saldoSubcuentas: 100.55,
      saldoConsolidado: 100.65,
    });
    expect(result[0].subcuentas.map((s) => s.ctaId)).toEqual([
      'sub-1',
      'sub-2',
    ]);
  });

  it('excluye cuentas raíz inactivas y subcuentas inactivas cuando incluirInactivas es false', () => {
    const cuentas: CuentaModel[] = [
      buildCuenta({
        ctaId: 'padre-activa',
        ctaSaldoActual: 500,
        ctaActiva: true,
      }),
      buildCuenta({
        ctaId: 'sub-activa',
        ctaCtaPadreId: 'padre-activa',
        ctaNaturaleza: null,
        ctaSaldoActual: 120.5,
        ctaActiva: true,
      }),
      buildCuenta({
        ctaId: 'sub-inactiva',
        ctaCtaPadreId: 'padre-activa',
        ctaNaturaleza: null,
        ctaSaldoActual: 999.99,
        ctaActiva: false,
      }),
      buildCuenta({
        ctaId: 'padre-inactiva',
        ctaSaldoActual: 300,
        ctaActiva: false,
      }),
    ];

    const result = construirJerarquiaCuentas(cuentas, false);

    expect(result).toHaveLength(1);
    expect(result[0].ctaId).toBe('padre-activa');
    expect(result[0].subcuentas).toHaveLength(1);
    expect(result[0].subcuentas[0].ctaId).toBe('sub-activa');
    expect(result[0].saldoPropio).toBe(500);
    expect(result[0].saldoSubcuentas).toBe(120.5);
    expect(result[0].saldoConsolidado).toBe(620.5);
  });

  it('incluye cuentas inactivas cuando incluirInactivas es true pero saldoSubcuentas solo suma subcuentas activas', () => {
    const cuentas: CuentaModel[] = [
      buildCuenta({
        ctaId: 'padre-activa',
        ctaSaldoActual: 200,
        ctaActiva: true,
      }),
      buildCuenta({
        ctaId: 'sub-activa',
        ctaCtaPadreId: 'padre-activa',
        ctaNaturaleza: null,
        ctaSaldoActual: 50.25,
        ctaActiva: true,
      }),
      buildCuenta({
        ctaId: 'sub-inactiva',
        ctaCtaPadreId: 'padre-activa',
        ctaNaturaleza: null,
        ctaSaldoActual: 400,
        ctaActiva: false,
      }),
      buildCuenta({
        ctaId: 'padre-inactiva',
        ctaSaldoActual: 100,
        ctaActiva: false,
      }),
    ];

    const result = construirJerarquiaCuentas(cuentas, true);

    expect(result).toHaveLength(2);
    const activa = result.find((c) => c.ctaId === 'padre-activa');
    const inactiva = result.find((c) => c.ctaId === 'padre-inactiva');
    expect(activa?.subcuentas.map((s) => s.ctaId)).toEqual([
      'sub-activa',
      'sub-inactiva',
    ]);
    expect(activa?.saldoPropio).toBe(200);
    expect(activa?.saldoSubcuentas).toBe(50.25);
    expect(activa?.saldoConsolidado).toBe(250.25);

    expect(inactiva?.saldoPropio).toBe(100);
    expect(inactiva?.saldoSubcuentas).toBe(0);
    expect(inactiva?.saldoConsolidado).toBe(100);
    expect(inactiva?.subcuentas).toEqual([]);
  });
});

describe('construirDetalleCuenta', () => {
  it('calcula saldoPropio, saldoSubcuentas (solo activas) y saldoConsolidado con precisión en centavos', () => {
    const padre = buildCuenta({
      ctaId: 'padre-1',
      ctaSaldoActual: 0.1,
    });
    const subcuentas: CuentaModel[] = [
      buildCuenta({
        ctaId: 'sub-1',
        ctaCtaPadreId: 'padre-1',
        ctaNaturaleza: null,
        ctaSaldoActual: 0.2,
        ctaActiva: true,
      }),
      buildCuenta({
        ctaId: 'sub-2',
        ctaCtaPadreId: 'padre-1',
        ctaNaturaleza: null,
        ctaSaldoActual: 500,
        ctaActiva: false,
      }),
    ];

    const detalle = construirDetalleCuenta(padre, subcuentas);

    expect(detalle).toMatchObject({
      ctaId: 'padre-1',
      saldoPropio: 0.1,
      saldoSubcuentas: 0.2,
      saldoConsolidado: 0.3,
    });
    expect(detalle.subcuentas.map((s) => s.ctaId)).toEqual(['sub-1', 'sub-2']);
  });

  it('retorna saldoSubcuentas = 0 y subcuentas = [] cuando la cuenta no tiene hijas', () => {
    const subcuenta = buildCuenta({
      ctaId: 'sub-1',
      ctaCtaPadreId: 'padre-1',
      ctaNaturaleza: null,
      ctaSaldoActual: 75.5,
    });

    const detalle = construirDetalleCuenta(subcuenta, []);

    expect(detalle).toMatchObject({
      ctaId: 'sub-1',
      saldoPropio: 75.5,
      saldoSubcuentas: 0,
      saldoConsolidado: 75.5,
      subcuentas: [],
    });
  });
});
