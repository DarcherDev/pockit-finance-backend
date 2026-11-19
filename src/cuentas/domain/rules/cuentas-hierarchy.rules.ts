import { DomainError } from '../../../common/domain';
import type { CuentaModel } from '../model/cuenta.model';

/**
 * Valida las reglas de jerarquía de 2 niveles y estado activo de la cuenta padre
 * antes de crear una subcuenta.
 */
export const validarCreacionSubcuenta = (padre: CuentaModel): void => {
  if (padre.ctaCtaPadreId !== null) {
    throw new DomainError(
      'JERARQUIA_MAXIMA_EXCEDIDA',
      'No se pueden crear subcuentas sobre una cuenta que ya es subcuenta.',
      422,
    );
  }

  if (!padre.ctaActiva) {
    throw new DomainError(
      'CUENTA_PADRE_INACTIVA',
      'No se pueden crear subcuentas sobre una cuenta padre inactiva.',
      422,
    );
  }
};
