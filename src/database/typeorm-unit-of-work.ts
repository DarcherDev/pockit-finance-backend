import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { TransactionContext, UnitOfWorkPort } from '../common/domain';

const txManagers = new WeakMap<TransactionContext, EntityManager>();

/**
 * Envuelve un `EntityManager` dentro de un `TransactionContext` opaco.
 */
export const createTransactionContext = (
  manager: EntityManager,
): TransactionContext => {
  const tx = Object.freeze({}) as TransactionContext;
  txManagers.set(tx, manager);
  return tx;
};

/**
 * Extrae el `EntityManager` subyacente desde un `TransactionContext` opaco en la capa de infraestructura.
 */
export const extractEntityManager = (
  tx?: TransactionContext,
): EntityManager | undefined => {
  if (!tx) {
    return undefined;
  }

  return txManagers.get(tx);
};

/**
 * Resuelve el repositorio TypeORM vinculado a la transacción en curso, o el repositorio base si no hay transacción.
 */
export const resolveRepository = <T extends ObjectLiteral>(
  repository: Repository<T>,
  entityClass: EntityTarget<T>,
  tx?: TransactionContext,
): Repository<T> => {
  const manager = extractEntityManager(tx);
  return manager ? manager.getRepository(entityClass) : repository;
};

/**
 * Adaptador TypeORM del puerto `UnitOfWorkPort` para orquestar transacciones SQL explícitas.
 */
@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly dataSource: DataSource) {}

  runInTransaction<T>(
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(createTransactionContext(manager)),
    );
  }
}
