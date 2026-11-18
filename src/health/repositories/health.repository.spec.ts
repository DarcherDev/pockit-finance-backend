import { DataSource } from 'typeorm';
import { HealthRepository } from './health.repository';

describe('HealthRepository', () => {
  let repository: HealthRepository;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    };
    repository = new HealthRepository(dataSource as unknown as DataSource);
  });

  it('ejecuta SELECT 1 en PostgreSQL y resuelve sin errores', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(repository.pingDatabase()).resolves.toBeUndefined();
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('propaga el error cuando falla la consulta a PostgreSQL', async () => {
    dataSource.query.mockRejectedValue(new Error('Connection refused'));

    await expect(repository.pingDatabase()).rejects.toThrow(
      'Connection refused',
    );
  });
});
