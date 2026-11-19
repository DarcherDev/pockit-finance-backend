import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseJwtGuard } from './auth/presentation/guards/supabase-jwt.guard';
import { CategoriasModule } from './categorias/categorias.module';
import { getDatabaseConfig } from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { CuentasModule } from './cuentas/cuentas.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    DatabaseModule,
    AuthModule,
    CategoriasModule,
    CuentasModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SupabaseJwtGuard,
    },
  ],
})
export class AppModule {}
