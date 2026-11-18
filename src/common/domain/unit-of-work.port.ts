import { TransactionContext } from './transaction-context';

export const UNIT_OF_WORK_PORT = Symbol('UNIT_OF_WORK_PORT');

/**
 * Puerto de salida para ejecutar bloques de trabajo dentro de una transacción atómica ACID.
 */
export interface UnitOfWorkPort {
  runInTransaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
