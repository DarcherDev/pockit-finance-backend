import type { Usuario } from '../../domain/model/usuario.model';
import { UsuarioResponse } from '../../presentation/dto/response/usuario.response';
import { UsuariosMapper } from './usuarios.mapper';

describe('UsuariosMapper', () => {
  let mapper: UsuariosMapper;

  beforeEach(() => {
    mapper = new UsuariosMapper();
  });

  it('mapea un modelo de dominio Usuario a UsuarioResponse', () => {
    const usuario: Usuario = {
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    };

    const result = mapper.toResponse(usuario);

    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).toEqual(usuario);
  });
});
