declare const TRANSACTION_CONTEXT_BRAND: unique symbol;

/**
 * Marca opaca de contexto transaccional para desacoplar las capas `domain` y
 * `application` de implementaciones concretas de ORM (`EntityManager`).
 */
export interface TransactionContext {
  readonly [TRANSACTION_CONTEXT_BRAND]: true;
}
