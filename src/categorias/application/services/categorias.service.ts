import { Inject, Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/domain';
import { buildSystemCategories } from '../../domain/policies/system-categories.seed';
import { CATEGORIAS_REPOSITORY_PORT } from '../../domain/ports/out/categorias-repository.port';
import type { CategoriasRepositoryPort } from '../../domain/ports/out/categorias-repository.port';
import { CategoriaResponse } from '../../presentation/dto/response/categoria.response';
import { CategoriasMapper } from '../mappers/categorias.mapper';

@Injectable()
export class CategoriasService {
  constructor(
    @Inject(CATEGORIAS_REPOSITORY_PORT)
    private readonly categoriasRepository: CategoriasRepositoryPort,
    private readonly categoriasMapper: CategoriasMapper,
  ) {}

  async crearCategoriasSistema(
    usrId: string,
    tx?: TransactionContext,
  ): Promise<CategoriaResponse[]> {
    const categorias = buildSystemCategories(usrId);
    const created = await this.categoriasRepository.createMany(categorias, tx);
    return created.map((categoria) =>
      this.categoriasMapper.toResponse(categoria),
    );
  }
}
