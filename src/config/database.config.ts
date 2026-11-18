import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Construye la configuración de TypeORM para PostgreSQL / Supabase
 * usando variables de entorno administradas por ConfigService.
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isSslEnabled = configService.get<string>('DB_SSL', 'true') === 'true';
  const isLoggingEnabled =
    configService.get<string>('DB_LOGGING', 'false') === 'true';

  return {
    type: 'postgres',
    url: configService.getOrThrow<string>('DATABASE_URL'),
    ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    // El esquema es gestionado externamente (SQL / migraciones en Supabase)
    synchronize: false,
    logging: isLoggingEnabled,
  };
};
