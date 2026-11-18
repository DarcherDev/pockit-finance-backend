import { UsuarioResponse } from '../../../../usuarios/presentation/dto/response/usuario.response';

export class LoginResponse {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  usuario!: UsuarioResponse;
}
