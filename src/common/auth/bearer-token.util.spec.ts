import { DomainError } from '../domain';
import { extractBearerToken } from './bearer-token.util';

describe('extractBearerToken', () => {
  it('extrae el token limpio cuando el header cumple formato Bearer', () => {
    expect(extractBearerToken('Bearer valid-token-123')).toBe(
      'valid-token-123',
    );
    expect(extractBearerToken('  bearer   valid-token-123  ')).toBe(
      'valid-token-123',
    );
  });

  it('lanza DomainError 401 TOKEN_NO_PROPORCIONADO por defecto cuando falta el header', () => {
    expect(() => extractBearerToken(undefined)).toThrow(DomainError);
    try {
      extractBearerToken(undefined);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'TOKEN_NO_PROPORCIONADO',
        statusCode: 401,
      });
    }
  });

  it.each(['', 'Token abc', 'Bearer ', 'Bearer   ', 'Bearer a b'])(
    'lanza DomainError 401 TOKEN_INVALIDO cuando Authorization es inválido (%p)',
    (invalidHeader) => {
      try {
        extractBearerToken(invalidHeader);
        throw new Error('Se esperaba DomainError');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toMatchObject({
          statusCode: 401,
        });
      }
    },
  );

  it('permite personalizar códigos y mensajes de error para flujos específicos', () => {
    try {
      extractBearerToken(undefined, {
        missingCode: 'TOKEN_RECUPERACION_INVALIDO',
        missingMessage: 'El token de recuperación es inválido o ha expirado.',
        invalidCode: 'TOKEN_RECUPERACION_INVALIDO',
        invalidMessage: 'El token de recuperación es inválido o ha expirado.',
      });
      throw new Error('Se esperaba DomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toMatchObject({
        code: 'TOKEN_RECUPERACION_INVALIDO',
        statusCode: 401,
      });
    }
  });
});
