/**
 * Normaliza un correo electrónico eliminando espacios laterales y convirtiéndolo a minúsculas.
 */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();
