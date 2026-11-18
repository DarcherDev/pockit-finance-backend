import { Injectable } from '@nestjs/common';
import { CategoriaResponse } from '../dto/response/categoria.response';
import { CategoriaEntity } from '../entities/categoria.entity';

@Injectable()
export class CategoriasMapper {
  toResponse(entity: CategoriaEntity): CategoriaResponse {
    const response = new CategoriaResponse();
    response.catId = entity.catId;
    response.catUsrId = entity.catUsrId;
    response.catNombre = entity.catNombre;
    response.catNaturaleza = entity.catNaturaleza;
    response.catColor = entity.catColor;
    response.catIcono = entity.catIcono;
    response.catEsSistema = entity.catEsSistema;
    response.catActiva = entity.catActiva;
    response.catCreadoEn = entity.catCreadoEn;
    response.catActualizadoEn = entity.catActualizadoEn;
    return response;
  }
}
