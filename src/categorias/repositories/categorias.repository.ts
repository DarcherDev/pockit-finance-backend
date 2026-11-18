import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CategoriaEntity,
  NaturalezaMovimiento,
} from '../entities/categoria.entity';

export interface CreateCategoriaData {
  catUsrId: string;
  catNombre: string;
  catNaturaleza: NaturalezaMovimiento;
  catColor: string;
  catIcono: string;
  catEsSistema: boolean;
  catActiva: boolean;
}

@Injectable()
export class CategoriasRepository {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly repository: Repository<CategoriaEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<CategoriaEntity> {
    return manager ? manager.getRepository(CategoriaEntity) : this.repository;
  }

  createMany(
    items: CreateCategoriaData[],
    manager?: EntityManager,
  ): Promise<CategoriaEntity[]> {
    const repo = this.getRepository(manager);
    const entities = items.map((item) => repo.create(item));
    return repo.save(entities);
  }
}
