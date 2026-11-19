import { DomainError } from '../../../common/domain';
import type { CuentaModel } from '../model/cuenta.model';
import {
  calcularActualizacionSaldoInicial,
  validarEdicionCuenta,
} from './cuentas-mutation.rules';

const makeCuenta = (overrides: Partial<CuentaModel> = {}): CuentaModel => ({
  ctaId: 'cta-1',
  ctaUsrId: 'usr-1',
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
  ...overrides,
});

describe('cuentas-mutation.rules', () => {
  describe('calcularActualizacionSaldoInicial', () => {
    it('incrementa ctaSaldoActual con precisión decimal cuando aumenta ctaSaldoInicial', () => {
      const result = calcularActualizacionSaldoInicial(100, 150, 140);

      expect(result).toEqual({
        ctaSaldoInicial: 140,
        ctaSaldoActual: 190,
      });
    });

    it('decrementa ctaSaldoActual con precisión decimal cuando disminuye ctaSaldoInicial', () => {
      const result = calcularActualizacionSaldoInicial(100.25, 150.75, 50.1);

      expect(result).toEqual({
        ctaSaldoInicial: 50.1,
        ctaSaldoActual: 100.6,
      });
    });

    it('normaliza decimales con roundMoney evitando errores de punto flotante', () => {
      const result = calcularActualizacionSaldoInicial(0.1, 0.3, 0.2);

      expect(result).toEqual({
        ctaSaldoInicial: 0.2,
        ctaSaldoActual: 0.4,
      });
    });
  });

  describe('validarEdicionCuenta', () => {
    it('permite editar ctaNaturaleza en una cuenta principal', () => {
      const cuentaPrincipal = makeCuenta({ ctaCtaPadreId: null });

      expect(() => validarEdicionCuenta(cuentaPrincipal, true)).not.toThrow();
    });

    it('permite editar una subcuenta cuando no se envía ctaNaturaleza', () => {
      const subcuenta = makeCuenta({
        ctaCtaPadreId: 'cta-padre-1',
        ctaNaturaleza: null,
      });

      expect(() => validarEdicionCuenta(subcuenta, false)).not.toThrow();
    });

    it('lanza DomainError 422 SUBCUENTA_NO_ADMITE_NATURALEZA si se envía ctaNaturaleza sobre una subcuenta', () => {
      const subcuenta = makeCuenta({
        ctaCtaPadreId: 'cta-padre-1',
        ctaNaturaleza: null,
      });

      expect(() => validarEdicionCuenta(subcuenta, true)).toThrow(DomainError);

      try {
        validarEdicionCuenta(subcuenta, true);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
        const domainError = error as DomainError;
        expect(domainError.code).toBe('SUBCUENTA_NO_ADMITE_NATURALEZA');
        expect(domainError.statusCode).toBe(422);
      }
    });
  });
});
