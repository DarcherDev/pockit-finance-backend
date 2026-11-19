import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCuentaRequest } from './create-cuenta.request';

describe('CreateCuentaRequest', () => {
  const validPayload = {
    ctaNombre: '  Bancolombia Ahorros  ',
    ctaNaturaleza: 'BANCO',
    ctaSaldoInicial: 150000,
    ctaColor: '#0F172A',
    ctaIcono: 'landmark',
  };

  it('valida un payload válido y aplica trim a ctaNombre', async () => {
    const dto = plainToInstance(CreateCuentaRequest, validPayload);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.ctaNombre).toBe('Bancolombia Ahorros');
    expect(dto.ctaSaldoInicial).toBe(150000);
  });

  it('permite omitir ctaSaldoInicial', async () => {
    const dto = plainToInstance(CreateCuentaRequest, {
      ctaNombre: 'Nequi',
      ctaNaturaleza: 'BILLETERA',
      ctaColor: '#7C3AED',
      ctaIcono: 'wallet',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.ctaSaldoInicial).toBeUndefined();
  });

  it('rechaza si falta ctaNaturaleza o tiene un valor inválido', async () => {
    const dtoMissing = plainToInstance(CreateCuentaRequest, {
      ctaNombre: 'Cuenta',
      ctaColor: '#0F172A',
      ctaIcono: 'landmark',
    });
    const errorsMissing = await validate(dtoMissing);
    expect(errorsMissing.some((e) => e.property === 'ctaNaturaleza')).toBe(
      true,
    );

    const dtoInvalid = plainToInstance(CreateCuentaRequest, {
      ...validPayload,
      ctaNaturaleza: 'EFECTIVO',
    });
    const errorsInvalid = await validate(dtoInvalid);
    expect(errorsInvalid.some((e) => e.property === 'ctaNaturaleza')).toBe(
      true,
    );
  });

  it('rechaza ctaNombre vacío después de trim o mayor a 100 caracteres', async () => {
    const dtoEmpty = plainToInstance(CreateCuentaRequest, {
      ...validPayload,
      ctaNombre: '   ',
    });
    const errorsEmpty = await validate(dtoEmpty);
    expect(errorsEmpty.some((e) => e.property === 'ctaNombre')).toBe(true);

    const dtoLong = plainToInstance(CreateCuentaRequest, {
      ...validPayload,
      ctaNombre: 'a'.repeat(101),
    });
    const errorsLong = await validate(dtoLong);
    expect(errorsLong.some((e) => e.property === 'ctaNombre')).toBe(true);
  });

  it('redondea y valida ctaSaldoInicial con TransformMoney y rechaza strings no numéricos', async () => {
    const dtoNumericString = plainToInstance(CreateCuentaRequest, {
      ...validPayload,
      ctaSaldoInicial: '123.456',
    });
    const errorsNumericString = await validate(dtoNumericString);
    expect(errorsNumericString).toHaveLength(0);
    expect(dtoNumericString.ctaSaldoInicial).toBe(123.46);

    const dtoInvalid = plainToInstance(CreateCuentaRequest, {
      ...validPayload,
      ctaSaldoInicial: 'no-es-numero',
    });
    const errorsInvalid = await validate(dtoInvalid);
    expect(errorsInvalid.some((e) => e.property === 'ctaSaldoInicial')).toBe(
      true,
    );
  });
});
