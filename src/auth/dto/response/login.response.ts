import { UsuarioResponse } from '../../../usuarios/dto/response/usuario.response';

export class LoginResponse {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  usuario!: UsuarioResponse;
}
