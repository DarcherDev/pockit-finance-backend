import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

describe('DomainException', () => {
  it('crea una excepción con statusCode, code, message y details por defecto null', () => {
    const exception = new DomainException(
      'INVALID_AMOUNT',
      'El monto debe ser positivo',
      HttpStatus.BAD_REQUEST,
    );

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.code).toBe('INVALID_AMOUNT');
    expect(exception.message).toBe('El monto debe ser positivo');
    expect(exception.details).toBeNull();
    expect(exception.getResponse()).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'INVALID_AMOUNT',
      message: 'El monto debe ser positivo',
      details: null,
    });
  });

  it('preserva details cuando se proporciona', () => {
    const details = { field: 'monto', value: -10 };
    const exception = new DomainException(
      'SERVICE_UNAVAILABLE',
      'Base de datos no disponible',
      HttpStatus.SERVICE_UNAVAILABLE,
      details,
    );

    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.details).toEqual(details);
  });
});
