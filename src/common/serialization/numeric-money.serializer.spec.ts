import { plainToInstance } from 'class-transformer';
import {
  TransformMoney,
  addMoney,
  fromCents,
  numericMoneyTransformer,
  roundMoney,
  subtractMoney,
  toCents,
} from './numeric-money.serializer';

class TestMoneyDto {
  @TransformMoney()
  monto!: number;
}

describe('numeric-money.serializer', () => {
  describe('toCents / fromCents / roundMoney', () => {
    it('convierte montos numéricos y strings a centavos enteros sin errores flotantes', () => {
      expect(toCents(0.1)).toBe(10);
      expect(toCents('123.45')).toBe(12345);
      expect(toCents(-50.25)).toBe(-5025);
      expect(toCents(0)).toBe(0);
      expect(toCents(1.005)).toBe(101);
      expect(fromCents(12345)).toBe(123.45);
      expect(fromCents(-0)).toBe(0);
    });

    it('evita imprecisiones de punto flotante como 0.1 + 0.2', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(subtractMoney(0.3, 0.1)).toBe(0.2);
      expect(addMoney('100.10', '200.20')).toBe(300.3);
    });

    it('lanza error para valores no numéricos, vacíos o no finitos', () => {
      expect(() => toCents('')).toThrow();
      expect(() => toCents('   ')).toThrow();
      expect(() => toCents('abc')).toThrow();
      expect(() => toCents(Number.NaN)).toThrow();
      expect(() => toCents(Number.POSITIVE_INFINITY)).toThrow();
      expect(() => fromCents(Number.NaN)).toThrow();
    });
  });

  describe('numericMoneyTransformer', () => {
    it('serializa a string con 2 decimales en to() y número redondeado en from()', () => {
      expect(numericMoneyTransformer.to(null)).toBeNull();
      expect(numericMoneyTransformer.to(undefined)).toBeNull();
      expect(numericMoneyTransformer.to(1250.5)).toBe('1250.50');
      expect(numericMoneyTransformer.to(0.1 + 0.2)).toBe('0.30');

      expect(numericMoneyTransformer.from(null)).toBeNull();
      expect(numericMoneyTransformer.from(undefined)).toBeNull();
      expect(numericMoneyTransformer.from('1250.50')).toBe(1250.5);
      expect(numericMoneyTransformer.from('0.30')).toBe(0.3);
    });
  });

  describe('TransformMoney', () => {
    it('normaliza strings numéricos y floats al instanciar DTOs', () => {
      const dto = plainToInstance(TestMoneyDto, { monto: '99.95' });
      expect(dto.monto).toBe(99.95);

      const invalidDto = plainToInstance(TestMoneyDto, { monto: 'invalid' });
      expect(invalidDto.monto).toBe('invalid');
    });
  });
});
