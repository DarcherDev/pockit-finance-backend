import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../common/domain';
import { resolveRepository } from '../../../../database/typeorm-unit-of-work';
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

  async findById(
    usrId: string,
    tx?: TransactionContext,
  ): Promise<Usuario | null> {
    const entity = await resolveRepository(this.repository, UsuarioEntity, tx).findOne({
      where: { usrId },
    });
    return entity ? this.persistenceMapper.toDomain(entity) : null;
  }

  async findByCorreo(
    correo: string,
    tx?: TransactionContext,
  ): Promise<Usuario | null> {
    const entity = await resolveRepository(this.repository, UsuarioEntity, tx)
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
    const repo = resolveRepository(this.repository, UsuarioEntity, tx);
    const entity = repo.create(data);
    const saved = await repo.save(entity);
    return this.persistenceMapper.toDomain(saved);
  }
}
