import { Transform } from 'class-transformer';
import { ValueTransformer } from 'typeorm';

const ACCOUNTING_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const padTwoDigits = (value: number): string => String(value).padStart(2, '0');

const isValidCalendarDate = (
  year: number,
  month: number,
  day: number,
): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() + 1 === month &&
    candidate.getUTCDate() === day
  );
};

export const formatAccountingDate = (value: Date | string): string => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Fecha contable inválida: Date inválido');
    }

    const year = value.getUTCFullYear();
    const month = padTwoDigits(value.getUTCMonth() + 1);
    const day = padTwoDigits(value.getUTCDate());
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = ACCOUNTING_DATE_REGEX.exec(trimmed);
    if (!match) {
      throw new Error(
        `Fecha contable inválida "${value}"; se esperaba formato YYYY-MM-DD`,
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!isValidCalendarDate(year, month, day)) {
      throw new Error(`Fecha contable inexistente "${value}"`);
    }

    return trimmed;
  }

  throw new Error('Fecha contable inválida; se esperaba Date o string');
};

export const accountingDateTransformer: ValueTransformer = {
  to(value: Date | string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return formatAccountingDate(value);
  },
  from(value: Date | string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return formatAccountingDate(value);
  },
};

export const TransformAccountingDate = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date || typeof value === 'string') {
      return formatAccountingDate(value);
    }

    return value;
  });
