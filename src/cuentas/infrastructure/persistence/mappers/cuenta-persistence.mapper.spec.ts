import { CuentaEntity } from '../entities/cuenta.entity';
import { CuentaPersistenceMapper } from './cuenta-persistence.mapper';

describe('CuentaPersistenceMapper', () => {
  let mapper: CuentaPersistenceMapper;

  beforeEach(() => {
    mapper = new CuentaPersistenceMapper();
  });

  it('mapea una CuentaEntity a un objeto plano CuentaModel de dominio', () => {
    const entity = Object.assign(new CuentaEntity(), {
      ctaId: 'cta-1',
      ctaUsrId: 'usr-1',
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO' as const,
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#1E293B',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });

    const domain = mapper.toDomain(entity);

    expect(domain).not.toBeInstanceOf(CuentaEntity);
    expect(domain).toEqual({
      ctaId: 'cta-1',
      ctaUsrId: 'usr-1',
      ctaCtaPadreId: null,
      ctaNaturaleza: 'BANCO',
      ctaNombre: 'Bancolombia',
      ctaSaldoInicial: 150000,
      ctaSaldoActual: 150000,
      ctaColor: '#1E293B',
      ctaIcono: 'landmark',
      ctaActiva: true,
      ctaCreadoEn: '2026-11-19T10:00:00.000Z',
      ctaActualizadoEn: '2026-11-19T10:00:00.000Z',
    });
  });
});
