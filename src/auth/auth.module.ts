import { Module } from '@nestjs/common';
import { CategoriasModule } from '../categorias/categorias.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './controllers/auth.controller';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { AuthService } from './services/auth.service';
import { SupabaseAuthService } from './services/supabase-auth.service';

@Module({
  imports: [UsuariosModule, CategoriasModule],
  controllers: [AuthController],
  providers: [SupabaseJwtGuard, SupabaseAuthService, AuthService],
  exports: [SupabaseJwtGuard, UsuariosModule, AuthService],
})
export class AuthModule {}
