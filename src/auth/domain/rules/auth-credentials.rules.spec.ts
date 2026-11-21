import { normalizeEmail } from './auth-credentials.rules';

describe('auth-credentials.rules', () => {
  describe('normalizeEmail', () => {
    it('recorta espacios y convierte el correo a minúsculas', () => {
      expect(normalizeEmail('  Ana.Garcia@Pockit.Finance  ')).toBe(
        'ana.garcia@pockit.finance',
      );
    });
  });
});
