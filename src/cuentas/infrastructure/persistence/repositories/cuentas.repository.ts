import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import {
  extractEntityManager,
  resolveRepository,
} from '../../../../database/typeorm-unit-of-work';
import type {
  CreateCuentaParams,
  CuentaModel,
  UpdateCuentaData,
} from '../../../domain/model/cuenta.model';
import {
  type ConteoTransaccionesCuenta,
  CuentasRepositoryPort,
} from '../../../domain/ports/out/cuentas-repository.port';
import { CuentaEntity } from '../entities/cuenta.entity';
import { CuentaPersistenceMapper } from '../mappers/cuenta-persistence.mapper';

@Injectable()
export class CuentasRepository implements CuentasRepositoryPort {
  constructor(
    @InjectRepository(CuentaEntity)
    private readonly repository: Repository<CuentaEntity>,
    private readonly persistenceMapper: CuentaPersistenceMapper,
  ) {}

  async create(
    params: CreateCuentaParams,
    ctx?: TransactionContext,
  ): Promise<CuentaModel> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    const entity = repo.create(params);
    const saved = await repo.save(entity);
    return this.persistenceMapper.toDomain(saved);
  }

  async findAllByUsuario(
    usrId: string,
    incluirInactivas: boolean,
    ctx?: TransactionContext,
  ): Promise<CuentaModel[]> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
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
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
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
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    const entities = await repo.find({
      where: { ctaCtaPadreId: padreId, ctaUsrId: usrId },
      order: { ctaCreadoEn: 'ASC', ctaNombre: 'ASC' },
    });

    return entities.map((entity) => this.persistenceMapper.toDomain(entity));
  }

  async findByIdAndUsuarioForUpdate(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<CuentaModel | null> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    const entity = await repo
      .createQueryBuilder('cta')
      .where('cta.cta_id = :ctaId', { ctaId })
      .andWhere('cta.cta_usr_id = :usrId', { usrId })
      .setLock('pessimistic_write')
      .getOne();

    return entity ? this.persistenceMapper.toDomain(entity) : null;
  }

  async findCuentaYSubcuentasForUpdate(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<CuentaModel[]> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    const entities = await repo
      .createQueryBuilder('cta')
      .where('cta.cta_usr_id = :usrId', { usrId })
      .andWhere('(cta.cta_id = :ctaId OR cta.cta_cta_padre_id = :ctaId)', {
        ctaId,
      })
      .orderBy('cta.cta_id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    return entities.map((entity) => this.persistenceMapper.toDomain(entity));
  }

  async updateById(
    ctaId: string,
    usrId: string,
    data: UpdateCuentaData,
    ctx: TransactionContext,
  ): Promise<CuentaModel> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    if (Object.keys(data).length > 0) {
      await repo.update({ ctaId, ctaUsrId: usrId }, data);
    }
    const updated = await repo.findOneOrFail({
      where: { ctaId, ctaUsrId: usrId },
    });
    return this.persistenceMapper.toDomain(updated);
  }

  async contarTransaccionesPorCuentas(
    ctaIds: string[],
    ctx: TransactionContext,
  ): Promise<ConteoTransaccionesCuenta> {
    if (ctaIds.length === 0) {
      return { total: 0, pendientes: 0 };
    }

    const manager = extractEntityManager(ctx) ?? this.repository.manager;
    const rows = await manager.query<
      Array<{ total?: number | string; pendientes?: number | string }>
    >(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE trx_estado = 'PENDIENTE')::int AS pendientes
      FROM public.transacciones
      WHERE trx_cta_id = ANY($1::uuid[])
      `,
      [ctaIds],
    );

    return {
      total: Number(rows[0]?.total ?? 0),
      pendientes: Number(rows[0]?.pendientes ?? 0),
    };
  }

  async desactivarCuentas(
    ctaIds: string[],
    usrId: string,
    ctx: TransactionContext,
  ): Promise<void> {
    if (ctaIds.length === 0) {
      return;
    }

    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    await repo.update(
      { ctaUsrId: usrId, ctaId: In(ctaIds) },
      { ctaActiva: false },
    );
  }

  async deleteByIdAndUsuario(
    ctaId: string,
    usrId: string,
    ctx: TransactionContext,
  ): Promise<void> {
    const repo = resolveRepository(this.repository, CuentaEntity, ctx);
    await repo.delete({ ctaId, ctaUsrId: usrId });
  }
}
