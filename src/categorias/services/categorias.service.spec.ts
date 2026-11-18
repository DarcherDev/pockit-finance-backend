import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { CategoriaResponse } from '../dto/response/categoria.response';
import { CategoriaEntity } from '../entities/categoria.entity';
import { CategoriasMapper } from '../mapper/categorias.mapper';
import { CategoriasRepository } from '../repositories/categorias.repository';
import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let repository: jest.Mocked<Pick<CategoriasRepository, 'createMany'>>;

  beforeEach(async () => {
    repository = {
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        CategoriasMapper,
        {
          provide: CategoriasRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoriasService>(CategoriasService);
  });

  it('crearCategoriasSistema crea Transferencia Saliente (GASTO) y Transferencia Entrante (INGRESO) con EntityManager', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const manager = {} as EntityManager;

    const createdEntities: CategoriaEntity[] = [
      Object.assign(new CategoriaEntity(), {
        catId: '111e8400-e29b-41d4-a716-446655440001',
        catUsrId: usrId,
        catNombre: 'Transferencia Saliente',
        catNaturaleza: 'GASTO' as const,
        catColor: '#64748B',
        catIcono: 'arrow-up-right',
        catEsSistema: true,
        catActiva: true,
        catCreadoEn: '2026-11-17T10:00:00.000Z',
        catActualizadoEn: '2026-11-17T10:00:00.000Z',
      }),
      Object.assign(new CategoriaEntity(), {
        catId: '222e8400-e29b-41d4-a716-446655440002',
        catUsrId: usrId,
        catNombre: 'Transferencia Entrante',
        catNaturaleza: 'INGRESO' as const,
        catColor: '#64748B',
        catIcono: 'arrow-down-left',
        catEsSistema: true,
        catActiva: true,
        catCreadoEn: '2026-11-17T10:00:00.000Z',
        catActualizadoEn: '2026-11-17T10:00:00.000Z',
      }),
    ];

    repository.createMany.mockResolvedValue(createdEntities);

    const result = await service.crearCategoriasSistema(usrId, manager);

    expect(repository.createMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          catUsrId: usrId,
          catNombre: 'Transferencia Saliente',
          catNaturaleza: 'GASTO',
          catEsSistema: true,
          catActiva: true,
        }),
        expect.objectContaining({
          catUsrId: usrId,
          catNombre: 'Transferencia Entrante',
          catNaturaleza: 'INGRESO',
          catEsSistema: true,
          catActiva: true,
        }),
      ],
      manager,
    );

    const passedItems = repository.createMany.mock.calls[0][0];
    for (const item of passedItems) {
      expect(item.catColor.length).toBeGreaterThan(0);
      expect(item.catColor.length).toBeLessThanOrEqual(20);
      expect(item.catIcono.length).toBeGreaterThan(0);
      expect(item.catIcono.length).toBeLessThanOrEqual(50);
    }

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(CategoriaResponse);
    expect(result[1]).toBeInstanceOf(CategoriaResponse);
  });
});
