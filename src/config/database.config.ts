import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Construye la configuración de TypeORM para PostgreSQL / Supabase
 * usando variables de entorno administradas por ConfigService.
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const rawSsl = configService.get<boolean | string>('DB_SSL', true);
  const isSslEnabled = rawSsl === true || rawSsl === 'true';
  const rawLogging = configService.get<boolean | string>('DB_LOGGING', false);
  const isLoggingEnabled = rawLogging === true || rawLogging === 'true';

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
