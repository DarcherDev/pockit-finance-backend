import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/domain';
import type { TransactionContext } from '../../../common/domain';
import type { CreateUsuarioData } from '../../domain/model/usuario.model';
import { USUARIOS_REPOSITORY_PORT } from '../../domain/ports/out/usuarios-repository.port';
import type { UsuariosRepositoryPort } from '../../domain/ports/out/usuarios-repository.port';
import { UsuarioResponse } from '../../presentation/dto/response/usuario.response';
import { UsuariosMapper } from '../mappers/usuarios.mapper';

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY_PORT)
    private readonly usuariosRepository: UsuariosRepositoryPort,
    private readonly usuariosMapper: UsuariosMapper,
  ) {}

  async findById(usrId: string): Promise<UsuarioResponse | null> {
    const usuario = await this.usuariosRepository.findById(usrId);
    if (!usuario) {
      return null;
    }

    return this.usuariosMapper.toResponse(usuario);
  }

  async findByCorreo(
    correo: string,
    tx?: TransactionContext,
  ): Promise<UsuarioResponse | null> {
    const usuario = await this.usuariosRepository.findByCorreo(correo, tx);
    if (!usuario) {
      return null;
    }

    return this.usuariosMapper.toResponse(usuario);
  }

  async create(
    data: CreateUsuarioData,
    tx?: TransactionContext,
  ): Promise<UsuarioResponse> {
    const usuario = await this.usuariosRepository.create(data, tx);
    return this.usuariosMapper.toResponse(usuario);
  }

  async obtenerPerfil(usrId: string): Promise<UsuarioResponse> {
    const usuario = await this.usuariosRepository.findById(usrId);
    if (!usuario) {
      throw new DomainError(
        'USUARIO_NO_ENCONTRADO',
        'Usuario no encontrado.',
        404,
      );
    }

    return this.usuariosMapper.toResponse(usuario);
  }
}
