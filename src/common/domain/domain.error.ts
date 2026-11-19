/**
 * Excepción pura de la capa de dominio y aplicación.
 * No depende de `@nestjs/common` ni de transporte HTTP para mantener aislado el núcleo de negocio.
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: unknown;

  constructor(
    code: string,
    message: string,
    statusCode = 400,
    details: unknown = null,
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Alias de compatibilidad para aserciones sobre código de estado HTTP.
   */
  get status(): number {
    return this.statusCode;
  }
}
