import type { TransactionContext } from '../../../../common/domain';
import type { CreateCuentaParams, CuentaModel } from '../../model/cuenta.model';

export const CUENTAS_REPOSITORY_PORT = Symbol('CUENTAS_REPOSITORY_PORT');

/**
 * Puerto de salida para persistencia de cuentas sin acoplamiento a TypeORM.
 */
export interface CuentasRepositoryPort {
  create(
    params: CreateCuentaParams,
    ctx?: TransactionContext,
  ): Promise<CuentaModel>;
  findAllByUsuario(
    usrId: string,
    incluirInactivas: boolean,
    ctx?: TransactionContext,
  ): Promise<CuentaModel[]>;
}
