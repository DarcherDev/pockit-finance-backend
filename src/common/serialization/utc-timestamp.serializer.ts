import { Transform } from 'class-transformer';
import { ValueTransformer } from 'typeorm';

export const formatUtcTimestamp = (value: Date | string): string => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Timestamp inválido: Date inválido');
    }
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Timestamp inválido: string vacío');
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Timestamp inválido "${value}"`);
    }
    return parsed.toISOString();
  }

  throw new Error('Timestamp inválido; se esperaba Date o string ISO');
};

export const utcTimestampTransformer: ValueTransformer = {
  to(value: Date | string | null | undefined): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    return new Date(formatUtcTimestamp(value));
  },
  from(value: Date | string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return formatUtcTimestamp(value);
  },
};

export const TransformUtcTimestamp = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date || typeof value === 'string') {
      return formatUtcTimestamp(value);
    }

    return value;
  });
