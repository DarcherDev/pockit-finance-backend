import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import { extractEntityManager } from '../../../../database/typeorm-unit-of-work';
import type {
  Categoria,
  CreateCategoriaData,
} from '../../../domain/model/categoria.model';
import { CategoriasRepositoryPort } from '../../../domain/ports/out/categorias-repository.port';
import { CategoriaEntity } from '../entities/categoria.entity';
import { CategoriaPersistenceMapper } from '../mappers/categoria-persistence.mapper';

@Injectable()
export class CategoriasRepository implements CategoriasRepositoryPort {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly repository: Repository<CategoriaEntity>,
    private readonly persistenceMapper: CategoriaPersistenceMapper,
  ) {}

  private getRepository(tx?: TransactionContext): Repository<CategoriaEntity> {
    const manager: EntityManager | undefined = extractEntityManager(tx);
    return manager ? manager.getRepository(CategoriaEntity) : this.repository;
  }

  async createMany(
    items: CreateCategoriaData[],
    tx?: TransactionContext,
  ): Promise<Categoria[]> {
    const repo = this.getRepository(tx);
    const entities = items.map((item) => repo.create(item));
    const saved = await repo.save(entities);
    return saved.map((entity) => this.persistenceMapper.toDomain(entity));
  }
}
