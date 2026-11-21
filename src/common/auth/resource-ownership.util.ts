import { DomainError } from '../domain';

/**
 * Verifica que el recurso pertenezca al usuario autenticado en curso.
 * Lanza `DomainError` 403 Forbidden cuando el propietario no coincide o algún ID está vacío.
 */
export const assertResourceOwnership = (
  ownerUsrId: string,
  currentUsrId: string,
): void => {
  const normalizedOwner = ownerUsrId?.trim();
  const normalizedCurrent = currentUsrId?.trim();

  if (
    !normalizedOwner ||
    !normalizedCurrent ||
    normalizedOwner !== normalizedCurrent
  ) {
    throw new DomainError(
      'RECURSO_NO_AUTORIZADO',
      'No tienes permisos para acceder o modificar este recurso',
      403,
    );
  }
};
