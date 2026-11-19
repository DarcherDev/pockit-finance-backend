import { DomainError } from '../../../common/domain';
import {
  extractRecoveryBearerToken,
  normalizeEmail,
} from './auth-credentials.rules';

describe('auth-credentials.rules', () => {
  describe('normalizeEmail', () => {
    it('recorta espacios y convierte el correo a minúsculas', () => {
      expect(normalizeEmail('  Ana.Garcia@Pockit.Finance  ')).toBe(
        'ana.garcia@pockit.finance',
      );
    });
  });

  describe('extractRecoveryBearerToken', () => {
    it('extrae el token limpio cuando el header cumple formato Bearer', () => {
      expect(extractRecoveryBearerToken('Bearer valid-token-123')).toBe(
        'valid-token-123',
      );
    });

    it.each([undefined, '', 'Token abc', 'Bearer ', 'Bearer   '])(
      'lanza DomainError 401 TOKEN_RECUPERACION_INVALIDO cuando Authorization es inválido (%p)',
      (invalidHeader) => {
        expect(() => extractRecoveryBearerToken(invalidHeader)).toThrow(
          DomainError,
        );
        try {
          extractRecoveryBearerToken(invalidHeader);
        } catch (error) {
          expect(error).toMatchObject({
            code: 'TOKEN_RECUPERACION_INVALIDO',
            statusCode: 401,
          });
        }
      },
    );
  });
});
