import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';

@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repository: Repository<UsuarioEntity>,
  ) {}

  findById(usrId: string): Promise<UsuarioEntity | null> {
    return this.repository.findOne({ where: { usrId } });
  }
}
