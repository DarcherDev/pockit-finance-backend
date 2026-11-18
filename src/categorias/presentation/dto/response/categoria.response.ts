import type { NaturalezaMovimiento } from '../../../domain/model/categoria.model';

export class CategoriaResponse {
  catId!: string;
  catUsrId!: string;
  catNombre!: string;
  catNaturaleza!: NaturalezaMovimiento;
  catColor!: string;
  catIcono!: string;
  catEsSistema!: boolean;
  catActiva!: boolean;
  catCreadoEn!: string;
  catActualizadoEn!: string;
}
