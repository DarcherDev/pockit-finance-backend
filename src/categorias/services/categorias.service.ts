import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CategoriaResponse } from '../dto/response/categoria.response';
import { CategoriasMapper } from '../mapper/categorias.mapper';
import {
  CategoriasRepository,
  CreateCategoriaData,
} from '../repositories/categorias.repository';

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

@Injectable()
export class CategoriasService {
  constructor(
    private readonly categoriasRepository: CategoriasRepository,
    private readonly categoriasMapper: CategoriasMapper,
  ) {}

  async crearCategoriasSistema(
    usrId: string,
    manager?: EntityManager,
  ): Promise<CategoriaResponse[]> {
    const categorias = SYSTEM_CATEGORIES_TEMPLATE.map((template) => ({
      ...template,
      catUsrId: usrId,
    }));

    const entities = await this.categoriasRepository.createMany(
      categorias,
      manager,
    );

    return entities.map((entity) => this.categoriasMapper.toResponse(entity));
  }
}
