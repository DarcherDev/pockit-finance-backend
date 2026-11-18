import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un controlador o endpoint como público, omitiendo la validación de `SupabaseJwtGuard`.
 */
export const Public = (): ClassDecorator & MethodDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
