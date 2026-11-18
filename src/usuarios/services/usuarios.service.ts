import { Injectable } from '@nestjs/common';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuariosMapper } from '../mapper/usuarios.mapper';
import { UsuariosRepository } from '../repositories/usuarios.repository';

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
}
