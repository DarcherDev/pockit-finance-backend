import { Test, TestingModule } from '@nestjs/testing';
import type { TransactionContext } from '../../../common/domain';
import type {
  Categoria,
  CreateCategoriaData,
} from '../../domain/model/categoria.model';
import { CATEGORIAS_REPOSITORY_PORT } from '../../domain/ports/out/categorias-repository.port';
import type { CategoriasRepositoryPort } from '../../domain/ports/out/categorias-repository.port';
import { CategoriaResponse } from '../../presentation/dto/response/categoria.response';
import { CategoriasMapper } from '../mappers/categorias.mapper';
import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let createManyMock: jest.Mock<
    Promise<Categoria[]>,
    [CreateCategoriaData[], TransactionContext?]
  >;
  let repository: CategoriasRepositoryPort;

  beforeEach(async () => {
    createManyMock = jest.fn<
      Promise<Categoria[]>,
      [CreateCategoriaData[], TransactionContext?]
    >();
    repository = {
      createMany: createManyMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        CategoriasMapper,
        {
          provide: CATEGORIAS_REPOSITORY_PORT,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoriasService>(CategoriasService);
  });

  it('crearCategoriasSistema crea Transferencia Saliente (GASTO) y Transferencia Entrante (INGRESO) con TransactionContext', async () => {
    const usrId = '550e8400-e29b-41d4-a716-446655440000';
    const tx: TransactionContext = {};

    const createdCategorias: Categoria[] = [
      {
        catId: '111e8400-e29b-41d4-a716-446655440001',
        catUsrId: usrId,
        catNombre: 'Transferencia Saliente',
        catNaturaleza: 'GASTO',
        catColor: '#64748B',
        catIcono: 'arrow-up-right',
        catEsSistema: true,
        catActiva: true,
        catCreadoEn: '2026-11-17T10:00:00.000Z',
        catActualizadoEn: '2026-11-17T10:00:00.000Z',
      },
      {
        catId: '222e8400-e29b-41d4-a716-446655440002',
        catUsrId: usrId,
        catNombre: 'Transferencia Entrante',
        catNaturaleza: 'INGRESO',
        catColor: '#64748B',
        catIcono: 'arrow-down-left',
        catEsSistema: true,
        catActiva: true,
        catCreadoEn: '2026-11-17T10:00:00.000Z',
        catActualizadoEn: '2026-11-17T10:00:00.000Z',
      },
    ];

    createManyMock.mockResolvedValue(createdCategorias);

    const result = await service.crearCategoriasSistema(usrId, tx);

    expect(createManyMock).toHaveBeenCalledWith(
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
      tx,
    );

    const passedItems = createManyMock.mock.calls[0][0];
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
