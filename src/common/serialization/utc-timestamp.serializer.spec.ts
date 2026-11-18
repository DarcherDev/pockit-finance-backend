import { plainToInstance } from 'class-transformer';
import {
  TransformUtcTimestamp,
  formatUtcTimestamp,
  utcTimestampTransformer,
} from './utc-timestamp.serializer';

class TestTimestampDto {
  @TransformUtcTimestamp()
  creadoEn!: string;
}

describe('utc-timestamp.serializer', () => {
  describe('formatUtcTimestamp', () => {
    it('normaliza Date y strings con offset a formato ISO-8601 UTC', () => {
      const date = new Date('2026-11-18T02:30:00.000Z');
      expect(formatUtcTimestamp(date)).toBe('2026-11-18T02:30:00.000Z');
      expect(formatUtcTimestamp('2026-11-17T21:30:00-05:00')).toBe(
        '2026-11-18T02:30:00.000Z',
      );
    });

    it('lanza error para timestamps inválidos o vacíos', () => {
      expect(() => formatUtcTimestamp('')).toThrow();
      expect(() => formatUtcTimestamp('not-a-date')).toThrow();
      expect(() => formatUtcTimestamp(new Date('invalid'))).toThrow();
    });
  });

  describe('utcTimestampTransformer', () => {
    it('convierte Date/string en to() a Date UTC y en from() a ISO-8601 UTC', () => {
      expect(utcTimestampTransformer.to(null)).toBeNull();
      expect(utcTimestampTransformer.to(undefined)).toBeNull();
      expect(
        utcTimestampTransformer.to('2026-11-17T21:30:00-05:00'),
      ).toEqual(new Date('2026-11-18T02:30:00.000Z'));

      expect(utcTimestampTransformer.from(null)).toBeNull();
      expect(utcTimestampTransformer.from(undefined)).toBeNull();
      expect(
        utcTimestampTransformer.from(new Date('2026-11-18T02:30:00.000Z')),
      ).toBe('2026-11-18T02:30:00.000Z');
    });
  });

  describe('TransformUtcTimestamp', () => {
    it('transforma Date a ISO-8601 UTC al instanciar DTOs', () => {
      const dto = plainToInstance(TestTimestampDto, {
        creadoEn: new Date('2026-11-18T02:30:00.000Z'),
      });

      expect(dto.creadoEn).toBe('2026-11-18T02:30:00.000Z');
    });
  });
});
