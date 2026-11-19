import type { TransactionContext } from '../../../../common/domain';
import type {
  Categoria,
  CreateCategoriaData,
} from '../../model/categoria.model';

export const CATEGORIAS_REPOSITORY_PORT = Symbol('CATEGORIAS_REPOSITORY_PORT');

/**
 * Puerto de salida para persistencia de categorías sin acoplamiento a TypeORM.
 */
export interface CategoriasRepositoryPort {
  createMany(
    items: CreateCategoriaData[],
    tx?: TransactionContext,
  ): Promise<Categoria[]>;
}
