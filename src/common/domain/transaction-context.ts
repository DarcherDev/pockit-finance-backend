/**
 * Marca opaca de contexto transaccional para desacoplar las capas `domain` y
 * `application` de implementaciones concretas de ORM (`EntityManager`).
 */
export interface TransactionContext {
  readonly __brand?: 'TransactionContext';
}
