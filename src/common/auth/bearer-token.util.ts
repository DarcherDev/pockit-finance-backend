import { DomainError } from '../domain';

export interface BearerTokenErrorConfig {
  missingCode?: string;
  missingMessage?: string;
  invalidCode?: string;
  invalidMessage?: string;
}

const DEFAULT_ERROR_CONFIG: Required<BearerTokenErrorConfig> = {
  missingCode: 'TOKEN_NO_PROPORCIONADO',
  missingMessage: 'Token de autenticación requerido',
  invalidCode: 'TOKEN_INVALIDO',
  invalidMessage:
    'Formato de encabezado Authorization inválido; se esperaba Bearer <token>',
};

/**
 * Extrae el token Bearer del encabezado HTTP `Authorization`.
 * Lanza `DomainError` 401 cuando el encabezado falta o no cumple el esquema `Bearer <token>`.
 */
export const extractBearerToken = (
  authorizationHeader?: string,
  config?: BearerTokenErrorConfig,
): string => {
  const resolved = { ...DEFAULT_ERROR_CONFIG, ...config };

  if (!authorizationHeader) {
    throw new DomainError(resolved.missingCode, resolved.missingMessage, 401);
  }

  const parts = authorizationHeader.trim().split(/\s+/);
  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== 'bearer' ||
    !parts[1]
  ) {
    throw new DomainError(resolved.invalidCode, resolved.invalidMessage, 401);
  }

  return parts[1];
};
