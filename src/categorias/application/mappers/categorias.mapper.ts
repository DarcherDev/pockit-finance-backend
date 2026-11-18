import { Injectable } from '@nestjs/common';
import type { Categoria } from '../../domain/model/categoria.model';
import { CategoriaResponse } from '../../presentation/dto/response/categoria.response';

@Injectable()
export class CategoriasMapper {
  toResponse(categoria: Categoria): CategoriaResponse {
    const response = new CategoriaResponse();
    response.catId = categoria.catId;
    response.catUsrId = categoria.catUsrId;
    response.catNombre = categoria.catNombre;
    response.catNaturaleza = categoria.catNaturaleza;
    response.catColor = categoria.catColor;
    response.catIcono = categoria.catIcono;
    response.catEsSistema = categoria.catEsSistema;
    response.catActiva = categoria.catActiva;
    response.catCreadoEn = categoria.catCreadoEn;
    response.catActualizadoEn = categoria.catActualizadoEn;
    return response;
  }
}
