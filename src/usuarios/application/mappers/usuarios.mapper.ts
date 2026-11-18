import { Injectable } from '@nestjs/common';
import type { Usuario } from '../../domain/model/usuario.model';
import { UsuarioResponse } from '../../presentation/dto/response/usuario.response';

@Injectable()
export class UsuariosMapper {
  toResponse(usuario: Usuario): UsuarioResponse {
    const response = new UsuarioResponse();
    response.usrId = usuario.usrId;
    response.usrCorreo = usuario.usrCorreo;
    response.usrNombre = usuario.usrNombre;
    response.usrApellido = usuario.usrApellido;
    response.usrEdad = usuario.usrEdad;
    response.usrCreadoEn = usuario.usrCreadoEn;
    response.usrActualizadoEn = usuario.usrActualizadoEn;
    return response;
  }
}
