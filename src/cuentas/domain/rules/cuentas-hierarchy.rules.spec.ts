import { DomainError } from '../../../common/domain';
import type { CuentaModel } from '../model/cuenta.model';
import { validarCreacionSubcuenta } from './cuentas-hierarchy.rules';

const buildCuenta = (overrides: Partial<CuentaModel>): CuentaModel => ({
  ctaId: 'cta-default',
  ctaUsrId: '550e8400-e29b-41d4-a716-446655440000',
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

describe('validarCreacionSubcuenta', () => {
  it('permite crear subcuenta cuando la cuenta padre es raíz y está activa', () => {
    const padre = buildCuenta({ ctaCtaPadreId: null, ctaActiva: true });

    expect(() => validarCreacionSubcuenta(padre)).not.toThrow();
  });

  it('lanza DomainError JERARQUIA_MAXIMA_EXCEDIDA (422) cuando el padre ya es una subcuenta', () => {
    const padreSubcuenta = buildCuenta({
      ctaCtaPadreId: 'padre-raiz',
      ctaNaturaleza: null,
      ctaActiva: true,
    });

    expect(() => validarCreacionSubcuenta(padreSubcuenta)).toThrow(DomainError);

    try {
      validarCreacionSubcuenta(padreSubcuenta);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('JERARQUIA_MAXIMA_EXCEDIDA');
      expect((error as DomainError).statusCode).toBe(422);
    }
  });

  it('lanza DomainError CUENTA_PADRE_INACTIVA (422) cuando la cuenta padre está inactiva', () => {
    const padreInactivo = buildCuenta({
      ctaCtaPadreId: null,
      ctaActiva: false,
    });

    expect(() => validarCreacionSubcuenta(padreInactivo)).toThrow(DomainError);

    try {
      validarCreacionSubcuenta(padreInactivo);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('CUENTA_PADRE_INACTIVA');
      expect((error as DomainError).statusCode).toBe(422);
    }
  });
});
