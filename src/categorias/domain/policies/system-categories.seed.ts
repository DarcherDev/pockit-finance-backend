import type { CreateCategoriaData } from '../model/categoria.model';

const SYSTEM_CATEGORIES_TEMPLATE: ReadonlyArray<
  Omit<CreateCategoriaData, 'catUsrId'>
> = [
  {
    catNombre: 'Transferencia Saliente',
    catNaturaleza: 'GASTO',
    catColor: '#64748B',
    catIcono: 'arrow-up-right',
    catEsSistema: true,
    catActiva: true,
  },
  {
    catNombre: 'Transferencia Entrante',
    catNaturaleza: 'INGRESO',
    catColor: '#64748B',
    catIcono: 'arrow-down-left',
    catEsSistema: true,
    catActiva: true,
  },
];

/**
 * Construye las categorías reservadas del sistema necesarias para transferencias entre cuentas.
 */
export const buildSystemCategories = (usrId: string): CreateCategoriaData[] =>
  SYSTEM_CATEGORIES_TEMPLATE.map((template) => ({
    ...template,
    catUsrId: usrId,
  }));
