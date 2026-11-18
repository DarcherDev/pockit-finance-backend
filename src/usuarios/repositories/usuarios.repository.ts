import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';

export interface CreateUsuarioData {
  usrId: string;
  usrCorreo: string;
  usrNombre: string;
  usrApellido: string;
  usrEdad: number;
}

@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repository: Repository<UsuarioEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<UsuarioEntity> {
    return manager ? manager.getRepository(UsuarioEntity) : this.repository;
  }

  findById(usrId: string): Promise<UsuarioEntity | null> {
    return this.repository.findOne({ where: { usrId } });
  }

  findByCorreo(
    correo: string,
    manager?: EntityManager,
  ): Promise<UsuarioEntity | null> {
    return this.getRepository(manager)
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.usrCorreo) = LOWER(:correo)', {
        correo: correo.trim(),
      })
      .getOne();
  }

  create(
    data: CreateUsuarioData,
    manager?: EntityManager,
  ): Promise<UsuarioEntity> {
    const repo = this.getRepository(manager);
    const entity = repo.create(data);
    return repo.save(entity);
  }
}
