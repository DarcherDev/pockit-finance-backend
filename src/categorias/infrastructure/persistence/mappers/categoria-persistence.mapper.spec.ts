import { CategoriaEntity } from '../entities/categoria.entity';
import { CategoriaPersistenceMapper } from './categoria-persistence.mapper';

describe('CategoriaPersistenceMapper', () => {
  it('traduce CategoriaEntity a modelo puro de dominio Categoria', () => {
    const mapper = new CategoriaPersistenceMapper();
    const entity = new CategoriaEntity();
    entity.catId = '111e8400-e29b-41d4-a716-446655440001';
    entity.catUsrId = '550e8400-e29b-41d4-a716-446655440000';
    entity.catNombre = 'Transferencia Saliente';
    entity.catNaturaleza = 'GASTO';
    entity.catColor = '#64748B';
    entity.catIcono = 'arrow-up-right';
    entity.catEsSistema = true;
    entity.catActiva = true;
    entity.catCreadoEn = '2026-11-17T10:00:00.000Z';
    entity.catActualizadoEn = '2026-11-17T10:00:00.000Z';

    const domain = mapper.toDomain(entity);

    expect(domain).not.toBeInstanceOf(CategoriaEntity);
    expect(domain).toEqual({
      catId: entity.catId,
      catUsrId: entity.catUsrId,
      catNombre: 'Transferencia Saliente',
      catNaturaleza: 'GASTO',
      catColor: '#64748B',
      catIcono: 'arrow-up-right',
      catEsSistema: true,
      catActiva: true,
      catCreadoEn: '2026-11-17T10:00:00.000Z',
      catActualizadoEn: '2026-11-17T10:00:00.000Z',
    });
  });
});
