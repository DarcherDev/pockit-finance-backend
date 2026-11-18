import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuariosMapper } from '../mapper/usuarios.mapper';
import {
  CreateUsuarioData,
  UsuariosRepository,
} from '../repositories/usuarios.repository';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly usuariosMapper: UsuariosMapper,
  ) {}

  async findById(usrId: string): Promise<UsuarioResponse | null> {
    const entity = await this.usuariosRepository.findById(usrId);
    if (!entity) {
      return null;
    }

    return this.usuariosMapper.toResponse(entity);
  }

  async findByCorreo(
    correo: string,
    manager?: EntityManager,
  ): Promise<UsuarioResponse | null> {
    const entity = await this.usuariosRepository.findByCorreo(correo, manager);
    if (!entity) {
      return null;
    }

    return this.usuariosMapper.toResponse(entity);
  }

  async create(
    data: CreateUsuarioData,
    manager?: EntityManager,
  ): Promise<UsuarioResponse> {
    const entity = await this.usuariosRepository.create(data, manager);
    return this.usuariosMapper.toResponse(entity);
  }

  async obtenerPerfil(usrId: string): Promise<UsuarioResponse> {
    const entity = await this.usuariosRepository.findById(usrId);
    if (!entity) {
      throw new DomainException(
        'USUARIO_NO_ENCONTRADO',
        'Usuario no encontrado.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.usuariosMapper.toResponse(entity);
  }
}
