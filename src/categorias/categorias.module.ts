import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasMapper } from './application/mappers/categorias.mapper';
import { CategoriasService } from './application/services/categorias.service';
import { CATEGORIAS_REPOSITORY_PORT } from './domain/ports/out/categorias-repository.port';
import { CategoriaEntity } from './infrastructure/persistence/entities/categoria.entity';
import { CategoriaPersistenceMapper } from './infrastructure/persistence/mappers/categoria-persistence.mapper';
import { CategoriasRepository } from './infrastructure/persistence/repositories/categorias.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaEntity])],
  providers: [
    CategoriaPersistenceMapper,
    CategoriasRepository,
    {
      provide: CATEGORIAS_REPOSITORY_PORT,
      useExisting: CategoriasRepository,
    },
    CategoriasMapper,
    CategoriasService,
  ],
  exports: [CategoriasService],
})
export class CategoriasModule { }
