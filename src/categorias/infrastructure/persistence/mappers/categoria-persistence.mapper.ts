import { Injectable } from '@nestjs/common';
import type { Categoria } from '../../../domain/model/categoria.model';
import { CategoriaEntity } from '../entities/categoria.entity';

@Injectable()
export class CategoriaPersistenceMapper {
  toDomain(entity: CategoriaEntity): Categoria {
    return {
      catId: entity.catId,
      catUsrId: entity.catUsrId,
      catNombre: entity.catNombre,
      catNaturaleza: entity.catNaturaleza,
      catColor: entity.catColor,
      catIcono: entity.catIcono,
      catEsSistema: entity.catEsSistema,
      catActiva: entity.catActiva,
      catCreadoEn: entity.catCreadoEn,
      catActualizadoEn: entity.catActualizadoEn,
    };
  }
}
