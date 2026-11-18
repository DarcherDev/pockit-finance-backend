import { DomainError } from './domain.error';

describe('DomainError', () => {
  it('crea un error puro de dominio con valores por defecto', () => {
    const error = new DomainError('INVALID_RULE', 'Regla violada');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DomainError');
    expect(error.code).toBe('INVALID_RULE');
    expect(error.message).toBe('Regla violada');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe(400);
    expect(error.details).toBeNull();
  });

  it('preserva statusCode y details personalizados', () => {
    const details = { database: 'down' };
    const error = new DomainError(
      'SERVICE_UNAVAILABLE',
      'BD caída',
      503,
      details,
    );

    expect(error.statusCode).toBe(503);
    expect(error.status).toBe(503);
    expect(error.details).toEqual(details);
  });
});
