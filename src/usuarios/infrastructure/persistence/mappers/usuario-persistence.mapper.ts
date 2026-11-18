import { Injectable } from '@nestjs/common';
import type { Usuario } from '../../../domain/model/usuario.model';
import { UsuarioEntity } from '../entities/usuario.entity';

@Injectable()
export class UsuarioPersistenceMapper {
  toDomain(entity: UsuarioEntity): Usuario {
    return {
      usrId: entity.usrId,
      usrCorreo: entity.usrCorreo,
      usrNombre: entity.usrNombre,
      usrApellido: entity.usrApellido,
      usrEdad: entity.usrEdad,
      usrCreadoEn: entity.usrCreadoEn,
      usrActualizadoEn: entity.usrActualizadoEn,
    };
  }
}
