import { buildSystemCategories } from './system-categories.seed';

describe('buildSystemCategories', () => {
  it('genera Transferencia Saliente (GASTO) y Transferencia Entrante (INGRESO) para el usuario', () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const categories = buildSystemCategories(usrId);

    expect(categories).toHaveLength(2);
    expect(categories[0]).toEqual({
      catUsrId: usrId,
      catNombre: 'Transferencia Saliente',
      catNaturaleza: 'GASTO',
      catColor: '#64748B',
      catIcono: 'arrow-up-right',
      catEsSistema: true,
      catActiva: true,
    });
    expect(categories[1]).toEqual({
      catUsrId: usrId,
      catNombre: 'Transferencia Entrante',
      catNaturaleza: 'INGRESO',
      catColor: '#64748B',
      catIcono: 'arrow-down-left',
      catEsSistema: true,
      catActiva: true,
    });
  });
});
