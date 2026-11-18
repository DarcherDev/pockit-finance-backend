import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEntity } from './entities/usuario.entity';
import { UsuariosMapper } from './mapper/usuarios.mapper';
import { UsuariosRepository } from './repositories/usuarios.repository';
import { UsuariosService } from './services/usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEntity])],
  providers: [UsuariosRepository, UsuariosMapper, UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
