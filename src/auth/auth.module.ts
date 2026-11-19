import { Module } from '@nestjs/common';
import { CategoriasModule } from '../categorias/categorias.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthService } from './application/services/auth.service';
import { AUTH_PROVIDER_PORT } from './domain/ports/out/auth-provider.port';
import { SupabaseAuthService } from './infrastructure/adapters/supabase-auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { SupabaseJwtGuard } from './presentation/guards/supabase-jwt.guard';

@Module({
  imports: [UsuariosModule, CategoriasModule],
  controllers: [AuthController],
  providers: [
    SupabaseJwtGuard,
    SupabaseAuthService,
    {
      provide: AUTH_PROVIDER_PORT,
      useExisting: SupabaseAuthService,
    },
    AuthService,
  ],
  exports: [SupabaseJwtGuard, UsuariosModule, AuthService],
})
export class AuthModule {}
