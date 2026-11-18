import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  const createConfigService = (values: Record<string, unknown>) =>
    ({
      get: jest.fn((key: string, defaultValue?: unknown) =>
        key in values ? values[key] : defaultValue,
      ),
      getOrThrow: jest.fn((key: string) => {
        if (!(key in values)) {
          throw new Error(`Missing key ${key}`);
        }
        return values[key];
      }),
    }) as unknown as ConfigService;

  it('configura SSL con rejectUnauthorized false cuando DB_SSL es true booleano', () => {
    const configService = createConfigService({
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
      DB_SSL: true,
      DB_LOGGING: false,
    });

    const config = getDatabaseConfig(configService);

    expect(config).toMatchObject({
      type: 'postgres',
      url: 'postgresql://postgres:pass@localhost:5432/postgres',
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
    });
  });

  it('configura SSL con rejectUnauthorized false cuando DB_SSL es string "true"', () => {
    const configService = createConfigService({
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
      DB_SSL: 'true',
      DB_LOGGING: 'true',
    });

    const config = getDatabaseConfig(configService);

    expect(config).toMatchObject({
      ssl: { rejectUnauthorized: false },
      logging: true,
    });
  });

  it('deshabilita SSL cuando DB_SSL es false', () => {
    const configService = createConfigService({
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
      DB_SSL: false,
      DB_LOGGING: false,
    });

    const config = getDatabaseConfig(configService);

    expect(config).toMatchObject({
      ssl: false,
      logging: false,
    });
  });
});
