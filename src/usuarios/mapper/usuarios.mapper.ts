import { Injectable } from '@nestjs/common';
import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuarioEntity } from '../entities/usuario.entity';

@Injectable()
export class UsuariosMapper {
  toResponse(entity: UsuarioEntity): UsuarioResponse {
    const response = new UsuarioResponse();
    response.usrId = entity.usrId;
    response.usrCorreo = entity.usrCorreo;
    response.usrNombre = entity.usrNombre;
    response.usrApellido = entity.usrApellido;
    response.usrEdad = entity.usrEdad;
    response.usrCreadoEn = entity.usrCreadoEn;
    response.usrActualizadoEn = entity.usrActualizadoEn;
    return response;
  }
}
