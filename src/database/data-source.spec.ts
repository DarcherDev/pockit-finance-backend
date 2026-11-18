import { AppDataSource, buildDataSourceOptions } from './data-source';

describe('AppDataSource', () => {
  it('configura opciones de TypeORM con SSL y synchronize false por defecto', () => {
    const options = buildDataSourceOptions({
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
      DB_SSL: 'true',
      DB_LOGGING: 'false',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgresql://postgres:pass@localhost:5432/postgres',
      ssl: { rejectUnauthorized: false },
      synchronize: false,
      logging: false,
    });
  });

  it('deshabilita SSL y habilita logging cuando corresponde', () => {
    const options = buildDataSourceOptions({
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
      DB_SSL: 'false',
      DB_LOGGING: 'true',
    });

    expect(options).toMatchObject({
      ssl: false,
      logging: true,
    });
  });

  it('exporta instancia AppDataSource con synchronize false', () => {
    expect(AppDataSource.options.type).toBe('postgres');
    expect(AppDataSource.options.synchronize).toBe(false);
  });
});
