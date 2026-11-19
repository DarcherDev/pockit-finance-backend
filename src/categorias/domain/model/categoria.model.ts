export type NaturalezaMovimiento = 'INGRESO' | 'GASTO';

/**
 * Modelo puro de dominio que representa una categoría financiera.
 */
export interface Categoria {
  catId: string;
  catUsrId: string;
  catNombre: string;
  catNaturaleza: NaturalezaMovimiento;
  catColor: string;
  catIcono: string;
  catEsSistema: boolean;
  catActiva: boolean;
  catCreadoEn: string;
  catActualizadoEn: string;
}

export interface CreateCategoriaData {
  catUsrId: string;
  catNombre: string;
  catNaturaleza: NaturalezaMovimiento;
  catColor: string;
  catIcono: string;
  catEsSistema: boolean;
  catActiva: boolean;
}
