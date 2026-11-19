import { UsuarioEntity } from '../entities/usuario.entity';
import { UsuarioPersistenceMapper } from './usuario-persistence.mapper';

describe('UsuarioPersistenceMapper', () => {
  it('traduce UsuarioEntity a modelo puro de dominio Usuario', () => {
    const mapper = new UsuarioPersistenceMapper();
    const entity = new UsuarioEntity();
    entity.usrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.usrCorreo = 'ana@pockit.finance';
    entity.usrNombre = 'Ana';
    entity.usrApellido = 'García';
    entity.usrEdad = 28;
    entity.usrCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.usrActualizadoEn = '2026-11-17T10:00:00.000Z';

    const domain = mapper.toDomain(entity);

    expect(domain).not.toBeInstanceOf(UsuarioEntity);
    expect(domain).toEqual({
      usrId: entity.usrId,
      usrCorreo: 'ana@pockit.finance',
      usrNombre: 'Ana',
      usrApellido: 'García',
      usrEdad: 28,
      usrCreadoEn: '2026-11-17T10:00:00.000Z',
      usrActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });
});
