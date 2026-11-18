import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaEntity } from './entities/categoria.entity';
import { CategoriasMapper } from './mapper/categorias.mapper';
import { CategoriasRepository } from './repositories/categorias.repository';
import { CategoriasService } from './services/categorias.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaEntity])],
  providers: [CategoriasRepository, CategoriasMapper, CategoriasService],
  exports: [CategoriasService],
})
export class CategoriasModule {}
