import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';

@Module({
  imports: [UsuariosModule],
  providers: [SupabaseJwtGuard],
  exports: [SupabaseJwtGuard, UsuariosModule],
})
export class AuthModule {}
