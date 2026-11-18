import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext, UnitOfWorkPort } from '../common/domain';

/**
 * Extrae el `EntityManager` subyacente desde un `TransactionContext` opaco en la capa de infraestructura.
 */
export const extractEntityManager = (
  tx?: TransactionContext,
): EntityManager | undefined => {
  if (!tx) {
    return undefined;
  }

  return tx as unknown as EntityManager;
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
      work(manager as unknown as TransactionContext),
    );
  }
}
