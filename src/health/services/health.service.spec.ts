import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';
import { HealthRepository } from '../repositories/health.repository';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let repository: { pingDatabase: jest.Mock };

  beforeEach(() => {
    repository = {
      pingDatabase: jest.fn(),
    };
    service = new HealthService(repository as unknown as HealthRepository);
  });

  it('retorna { status: "ok", database: "up" } cuando PostgreSQL responde', async () => {
    repository.pingDatabase.mockResolvedValue(undefined);

    const result = await service.checkHealth();

    expect(result).toEqual({ status: 'ok', database: 'up' });
    expect(repository.pingDatabase).toHaveBeenCalledTimes(1);
  });

  it('lanza DomainException 503 SERVICE_UNAVAILABLE cuando falla la conexión a BD', async () => {
    repository.pingDatabase.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.checkHealth()).rejects.toThrow(DomainException);

    try {
      await service.checkHealth();
    } catch (error) {
      const domainError = error as DomainException;
      expect(domainError.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(domainError.code).toBe('SERVICE_UNAVAILABLE');
      expect(domainError.details).toEqual({ database: 'down' });
    }
  });
});
