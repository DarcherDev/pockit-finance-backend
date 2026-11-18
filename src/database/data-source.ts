import 'dotenv/config';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

export const buildDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => {
  const isSslEnabled = (env.DB_SSL ?? 'true') === 'true';
  const isLoggingEnabled = (env.DB_LOGGING ?? 'false') === 'true';

  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    logging: isLoggingEnabled,
  };
};

export const AppDataSource = new DataSource(buildDataSourceOptions());
