import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Verifica que el recurso pertenezca al usuario autenticado en curso.
 * Lanza `DomainException` 403 Forbidden cuando el propietario no coincide o algún ID está vacío.
 */
export const assertResourceOwnership = (
  ownerUsrId: string,
  currentUsrId: string,
): void => {
  const normalizedOwner = ownerUsrId?.trim();
  const normalizedCurrent = currentUsrId?.trim();

  if (!normalizedOwner || !normalizedCurrent || normalizedOwner !== normalizedCurrent) {
    throw new DomainException(
      'RECURSO_NO_AUTORIZADO',
      'No tienes permisos para acceder o modificar este recurso',
      HttpStatus.FORBIDDEN,
    );
  }
};
