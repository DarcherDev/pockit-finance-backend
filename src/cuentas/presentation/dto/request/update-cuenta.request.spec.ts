import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCuentaRequest } from './update-cuenta.request';

describe('UpdateCuentaRequest', () => {
  it('permite actualización parcial con campos opcionales y aplica trim a ctaNombre', async () => {
    const dto = plainToInstance(UpdateCuentaRequest, {
      ctaNombre: '  Bancolombia Nómina  ',
      ctaSaldoInicial: 140.5,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.ctaNombre).toBe('Bancolombia Nómina');
    expect(dto.ctaSaldoInicial).toBe(140.5);
  });

  it('permite payload vacío sin errores', async () => {
    const dto = plainToInstance(UpdateCuentaRequest, {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('rechaza ctaSaldoActual mediante forbidNonWhitelisted', async () => {
    const dto = plainToInstance(UpdateCuentaRequest, {
      ctaNombre: 'Bancolombia',
      ctaSaldoActual: 999999,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((e) => e.property === 'ctaSaldoActual')).toBe(true);
  });

  it('rechaza ctaNaturaleza inválido', async () => {
    const dto = plainToInstance(UpdateCuentaRequest, {
      ctaNaturaleza: 'EFECTIVO',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((e) => e.property === 'ctaNaturaleza')).toBe(true);
  });

  it('rechaza ctaNombre vacío después de trim', async () => {
    const dto = plainToInstance(UpdateCuentaRequest, {
      ctaNombre: '   ',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.some((e) => e.property === 'ctaNombre')).toBe(true);
  });
});
