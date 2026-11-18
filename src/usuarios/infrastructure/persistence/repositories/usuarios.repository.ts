import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import { extractEntityManager } from '../../../../database/typeorm-unit-of-work';
import type {
  CreateUsuarioData,
  Usuario,
} from '../../../domain/model/usuario.model';
import { UsuariosRepositoryPort } from '../../../domain/ports/out/usuarios-repository.port';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuarioPersistenceMapper } from '../mappers/usuario-persistence.mapper';

@Injectable()
export class UsuariosRepository implements UsuariosRepositoryPort {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repository: Repository<UsuarioEntity>,
    private readonly persistenceMapper: UsuarioPersistenceMapper,
  ) {}

  private getRepository(tx?: TransactionContext): Repository<UsuarioEntity> {
    const manager: EntityManager | undefined = extractEntityManager(tx);
    return manager ? manager.getRepository(UsuarioEntity) : this.repository;
  }

  async findById(usrId: string): Promise<Usuario | null> {
    const entity = await this.repository.findOne({ where: { usrId } });
    return entity ? this.persistenceMapper.toDomain(entity) : null;
  }

  async findByCorreo(
    correo: string,
    tx?: TransactionContext,
  ): Promise<Usuario | null> {
    const entity = await this.getRepository(tx)
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.usrCorreo) = LOWER(:correo)', {
        correo: correo.trim(),
      })
      .getOne();

    return entity ? this.persistenceMapper.toDomain(entity) : null;
  }

  async create(
    data: CreateUsuarioData,
    tx?: TransactionContext,
  ): Promise<Usuario> {
    const repo = this.getRepository(tx);
    const entity = repo.create(data);
    const saved = await repo.save(entity);
    return this.persistenceMapper.toDomain(saved);
  }
}
