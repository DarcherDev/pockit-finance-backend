import { DataSource, EntityManager } from 'typeorm';
import {
  TypeOrmUnitOfWork,
  extractEntityManager,
} from './typeorm-unit-of-work';

describe('TypeOrmUnitOfWork', () => {
  it('ejecuta el callback dentro de DataSource.transaction y propaga el contexto', async () => {
    const managerMock = { id: 'tx-manager' } as unknown as EntityManager;
    const dataSourceMock = {
      transaction: jest.fn((cb: (manager: EntityManager) => Promise<unknown>) =>
        cb(managerMock),
      ),
    } as unknown as DataSource;

    const unitOfWork = new TypeOrmUnitOfWork(dataSourceMock);

    const result = await unitOfWork.runInTransaction((tx) => {
      expect(extractEntityManager(tx)).toBe(managerMock);
      return Promise.resolve('ok');
    });

    expect(result).toBe('ok');
    expect(extractEntityManager(undefined)).toBeUndefined();
  });
});
