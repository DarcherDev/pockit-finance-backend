import { Transform } from 'class-transformer';
import { ValueTransformer } from 'typeorm';

const NUMERIC_STRING_REGEX = /^-?\d+(?:\.\d+)?$/;

const parseFiniteNumber = (value: number | string): number => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Monto inválido: el número debe ser finito');
    }
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!NUMERIC_STRING_REGEX.test(trimmed)) {
      throw new Error(`Monto inválido "${value}"`);
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Monto inválido "${value}"`);
    }
    return parsed;
  }

  throw new Error('Monto inválido; se esperaba number o string numérico');
};

export const toCents = (value: number | string): number => {
  const numericValue = parseFiniteNumber(value);
  const cents = Math.round(
    (numericValue + Number.EPSILON * Math.sign(numericValue)) * 100,
  );
  return cents === 0 ? 0 : cents;
};

export const fromCents = (cents: number): number => {
  if (!Number.isFinite(cents)) {
    throw new Error('Centavos inválidos: el valor debe ser finito');
  }

  const normalized = Number((Math.round(cents) / 100).toFixed(2));
  return normalized === 0 ? 0 : normalized;
};

export const roundMoney = (value: number | string): number =>
  fromCents(toCents(value));

export const addMoney = (a: number | string, b: number | string): number =>
  fromCents(toCents(a) + toCents(b));

export const subtractMoney = (a: number | string, b: number | string): number =>
  fromCents(toCents(a) - toCents(b));

export const numericMoneyTransformer: ValueTransformer = {
  to(value: number | string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return roundMoney(value).toFixed(2);
  },
  from(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return roundMoney(value);
  },
};

export const TransformMoney = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return roundMoney(value);
    }

    if (typeof value === 'string' && NUMERIC_STRING_REGEX.test(value.trim())) {
      return roundMoney(value);
    }

    return value;
  });
