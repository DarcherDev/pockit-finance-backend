import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubcuentaRequest } from './create-subcuenta.request';

describe('CreateSubcuentaRequest', () => {
  const validPayload = {
    ctaNombre: '  Bolsillo Vacaciones  ',
    ctaSaldoInicial: 50000,
    ctaColor: '#0EA5E9',
    ctaIcono: 'piggy-bank',
  };

  it('valida un payload válido y aplica trim a ctaNombre', async () => {
    const dto = plainToInstance(CreateSubcuentaRequest, validPayload);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.ctaNombre).toBe('Bolsillo Vacaciones');
    expect(dto.ctaSaldoInicial).toBe(50000);
  });

  it('permite omitir ctaSaldoInicial', async () => {
    const dto = plainToInstance(CreateSubcuentaRequest, {
      ctaNombre: 'Bolsillo Emergencia',
      ctaColor: '#10B981',
      ctaIcono: 'shield',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.ctaSaldoInicial).toBeUndefined();
  });

  it('rechaza ctaSaldoInicial negativo', async () => {
    const dto = plainToInstance(CreateSubcuentaRequest, {
      ...validPayload,
      ctaSaldoInicial: -10,
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'ctaSaldoInicial')).toBe(true);
  });

  it('rechaza ctaNombre vacío después de trim o mayor a 100 caracteres', async () => {
    const dtoEmpty = plainToInstance(CreateSubcuentaRequest, {
      ...validPayload,
      ctaNombre: '   ',
    });
    const errorsEmpty = await validate(dtoEmpty);
    expect(errorsEmpty.some((e) => e.property === 'ctaNombre')).toBe(true);

    const dtoLong = plainToInstance(CreateSubcuentaRequest, {
      ...validPayload,
      ctaNombre: 'a'.repeat(101),
    });
    const errorsLong = await validate(dtoLong);
    expect(errorsLong.some((e) => e.property === 'ctaNombre')).toBe(true);
  });

  it('rechaza ctaColor o ctaIcono faltantes, vacíos o fuera de longitud máxima', async () => {
    const dtoInvalid = plainToInstance(CreateSubcuentaRequest, {
      ctaNombre: 'Bolsillo',
      ctaColor: '',
      ctaIcono: 'a'.repeat(51),
    });
    const errors = await validate(dtoInvalid);

    expect(errors.some((e) => e.property === 'ctaColor')).toBe(true);
    expect(errors.some((e) => e.property === 'ctaIcono')).toBe(true);
  });

  it('redondea y valida ctaSaldoInicial con TransformMoney y rechaza strings no numéricos', async () => {
    const dtoNumericString = plainToInstance(CreateSubcuentaRequest, {
      ...validPayload,
      ctaSaldoInicial: '123.456',
    });
    const errorsNumericString = await validate(dtoNumericString);
    expect(errorsNumericString).toHaveLength(0);
    expect(dtoNumericString.ctaSaldoInicial).toBe(123.46);

    const dtoInvalid = plainToInstance(CreateSubcuentaRequest, {
      ...validPayload,
      ctaSaldoInicial: 'no-es-numero',
    });
    const errorsInvalid = await validate(dtoInvalid);
    expect(errorsInvalid.some((e) => e.property === 'ctaSaldoInicial')).toBe(
      true,
    );
  });
});
