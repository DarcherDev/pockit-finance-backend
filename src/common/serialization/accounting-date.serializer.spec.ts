import { plainToInstance } from 'class-transformer';
import {
  TransformAccountingDate,
  accountingDateTransformer,
  formatAccountingDate,
} from './accounting-date.serializer';

class TestDateDto {
  @TransformAccountingDate()
  fecha!: string;
}

describe('accounting-date.serializer', () => {
  describe('formatAccountingDate', () => {
    it('mantiene string YYYY-MM-DD válido sin alterarlo', () => {
      expect(formatAccountingDate('2026-11-18')).toBe('2026-11-18');
      expect(formatAccountingDate('2024-02-29')).toBe('2024-02-29');
    });

    it('serializa Date usando getters UTC sin corrimiento por zona horaria', () => {
      const utcMidnight = new Date('2026-03-01T00:00:00.000Z');
      const utcLateNight = new Date('2026-03-01T23:59:59.999Z');

      expect(formatAccountingDate(utcMidnight)).toBe('2026-03-01');
      expect(formatAccountingDate(utcLateNight)).toBe('2026-03-01');
    });

    it('rechaza fechas calendario inexistentes o formatos inválidos', () => {
      expect(() => formatAccountingDate('2026-02-29')).toThrow();
      expect(() => formatAccountingDate('2026-04-31')).toThrow();
      expect(() => formatAccountingDate('2026-13-01')).toThrow();
      expect(() => formatAccountingDate('18-11-2026')).toThrow();
      expect(() => formatAccountingDate('')).toThrow();
      expect(() => formatAccountingDate(new Date('invalid'))).toThrow();
    });
  });

  describe('accountingDateTransformer', () => {
    it('convierte Date y string YYYY-MM-DD en to/from preservando null', () => {
      expect(accountingDateTransformer.to(null)).toBeNull();
      expect(accountingDateTransformer.to(undefined)).toBeNull();
      expect(
        accountingDateTransformer.to(new Date('2026-01-15T00:00:00.000Z')),
      ).toBe('2026-01-15');
      expect(accountingDateTransformer.to('2026-01-15')).toBe('2026-01-15');

      expect(accountingDateTransformer.from(null)).toBeNull();
      expect(accountingDateTransformer.from(undefined)).toBeNull();
      expect(
        accountingDateTransformer.from(new Date('2026-01-15T00:00:00.000Z')),
      ).toBe('2026-01-15');
      expect(accountingDateTransformer.from('2026-01-15')).toBe('2026-01-15');
    });
  });

  describe('TransformAccountingDate', () => {
    it('transforma Date a YYYY-MM-DD al instanciar DTOs', () => {
      const dto = plainToInstance(TestDateDto, {
        fecha: new Date('2026-05-10T00:00:00.000Z'),
      });

      expect(dto.fecha).toBe('2026-05-10');
    });
  });
});
