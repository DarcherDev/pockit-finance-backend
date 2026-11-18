import { UsuarioResponse } from '../dto/response/usuario.response';
import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuariosMapper } from './usuarios.mapper';

describe('UsuariosMapper', () => {
  let mapper: UsuariosMapper;

  beforeEach(() => {
    mapper = new UsuariosMapper();
  });

  it('mapea una UsuarioEntity a UsuarioResponse sin exponer la instancia de entidad', () => {
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    const result = mapper.toResponse(entity);

    expect(result).toBeInstanceOf(UsuarioResponse);
    expect(result).not.toBeInstanceOf(UsuarioEntity);
    expect(result).toEqual({
      usrId: '550e8400-e29b-41d4-a716-446655440000',
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });
});
