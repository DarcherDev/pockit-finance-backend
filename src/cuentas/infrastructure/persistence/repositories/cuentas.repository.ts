import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import { extractEntityManager } from '../../../../database/typeorm-unit-of-work';
import type {
  CreateCuentaParams,
  CuentaModel,
} from '../../../domain/model/cuenta.model';
import { CuentasRepositoryPort } from '../../../domain/ports/out/cuentas-repository.port';
import { CuentaEntity } from '../entities/cuenta.entity';
import { CuentaPersistenceMapper } from '../mappers/cuenta-persistence.mapper';

@Injectable()
export class CuentasRepository implements CuentasRepositoryPort {
  constructor(
    @InjectRepository(CuentaEntity)
    private readonly repository: Repository<CuentaEntity>,
    private readonly persistenceMapper: CuentaPersistenceMapper,
  ) {}

  private getRepository(ctx?: TransactionContext): Repository<CuentaEntity> {
    const manager: EntityManager | undefined = extractEntityManager(ctx);
    return manager ? manager.getRepository(CuentaEntity) : this.repository;
  }

  async create(
    params: CreateCuentaParams,
    ctx?: TransactionContext,
  ): Promise<CuentaModel> {
    const repo = this.getRepository(ctx);
    const entity = repo.create(params);
    const saved = await repo.save(entity);
    return this.persistenceMapper.toDomain(saved);
  }

  async findAllByUsuario(
    usrId: string,
    incluirInactivas: boolean,
    ctx?: TransactionContext,
  ): Promise<CuentaModel[]> {
    const repo = this.getRepository(ctx);
    const where: FindOptionsWhere<CuentaEntity> = incluirInactivas
      ? { ctaUsrId: usrId }
      : { ctaUsrId: usrId, ctaActiva: true };

    const entities = await repo.find({
      where,
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });

    return entities.map((entity) => this.persistenceMapper.toDomain(entity));
  }

  async findByIdAndUsuario(
    ctaId: string,
    usrId: string,
    ctx?: TransactionContext,
  ): Promise<CuentaModel | null> {
    const repo = this.getRepository(ctx);
    const entity = await repo.findOne({
      where: { ctaId, ctaUsrId: usrId },
    });

    return entity ? this.persistenceMapper.toDomain(entity) : null;
  }

  async findSubcuentasByPadreId(
    padreId: string,
    usrId: string,
    ctx?: TransactionContext,
  ): Promise<CuentaModel[]> {
    const repo = this.getRepository(ctx);
    const entities = await repo.find({
      where: { ctaCtaPadreId: padreId, ctaUsrId: usrId },
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });

    return entities.map((entity) => this.persistenceMapper.toDomain(entity));
  }
}
