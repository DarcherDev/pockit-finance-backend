import type { TransactionContext } from '../../../../common/domain';
import type {
  CreateCuentaParams,
  CuentaModel,
  UpdateCuentaData,
} from '../../model/cuenta.model';

export const CUENTAS_REPOSITORY_PORT = Symbol('CUENTAS_REPOSITORY_PORT');

export interface ConteoTransaccionesCuenta {
  total: number;
  pendientes: number;
}

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
  findByIdAndUsuario(
    ctaId: string,
    usrId: string,
    ctx?: TransactionContext,
  ): Promise<CuentaModel | null>;
  findSubcuentasByPadreId(
    padreId: string,
    usrId: string,
    ctx?: TransactionContext,
  ): Promise<CuentaModel[]>;
  findByIdAndUsuarioForUpdate(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<CuentaModel | null>;
  findCuentaYSubcuentasForUpdate(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<CuentaModel[]>;
  updateById(
    ctaId: string,
    usrId: string,
    data: UpdateCuentaData,
    ctx: TransactionContext,
  ): Promise<CuentaModel>;
  contarTransaccionesPorCuentas(
    ctaIds: string[],
    ctx: TransactionContext,
  ): Promise<ConteoTransaccionesCuenta>;
  desactivarCuentas(
    ctaIds: string[],
    usrId: string,
    ctx: TransactionContext,
  ): Promise<void>;
  deleteByIdAndUsuario(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<void>;
}
