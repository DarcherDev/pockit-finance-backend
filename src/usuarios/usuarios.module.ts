import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosMapper } from './application/mappers/usuarios.mapper';
import { UsuariosService } from './application/services/usuarios.service';
import { USUARIOS_REPOSITORY_PORT } from './domain/ports/out/usuarios-repository.port';
import { UsuarioEntity } from './infrastructure/persistence/entities/usuario.entity';
import { UsuarioPersistenceMapper } from './infrastructure/persistence/mappers/usuario-persistence.mapper';
import { UsuariosRepository } from './infrastructure/persistence/repositories/usuarios.repository';
import { UsuariosController } from './presentation/controllers/usuarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEntity])],
  controllers: [UsuariosController],
  providers: [
    UsuarioPersistenceMapper,
    UsuariosRepository,
    {
      provide: USUARIOS_REPOSITORY_PORT,
      useExisting: UsuariosRepository,
    },
    UsuariosMapper,
    UsuariosService,
  ],
  exports: [UsuariosService],
})
export class UsuariosModule { }
