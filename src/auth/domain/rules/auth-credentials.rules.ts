import { DomainError } from '../../../common/domain';

/**
 * Normaliza un correo electrónico eliminando espacios laterales y convirtiéndolo a minúsculas.
 */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/**
 * Extrae el token Bearer del encabezado `Authorization` para restablecimiento de contraseña.
 * Lanza `DomainError` 401 cuando el encabezado falta o no cumple el esquema `Bearer <token>`.
 */
export const extractRecoveryBearerToken = (
  authorizationHeader?: string,
): string => {
  if (!authorizationHeader) {
    throw new DomainError(
      'TOKEN_RECUPERACION_INVALIDO',
      'El token de recuperación es inválido o ha expirado.',
      401,
    );
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token?.trim()) {
    throw new DomainError(
      'TOKEN_RECUPERACION_INVALIDO',
      'El token de recuperación es inválido o ha expirado.',
      401,
    );
  }

  return token.trim();
};
