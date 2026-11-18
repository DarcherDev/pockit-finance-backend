import type { NaturalezaMovimiento } from '../../entities/categoria.entity';

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
