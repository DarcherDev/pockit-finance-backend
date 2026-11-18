import { DomainError } from '../../../common/domain';
import type { HealthProbePort } from '../../domain/ports/out/health-probe.port';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let pingDatabaseMock: jest.Mock<Promise<void>, []>;
  let probePort: HealthProbePort;

  beforeEach(() => {
    pingDatabaseMock = jest.fn<Promise<void>, []>();
    probePort = {
      pingDatabase: pingDatabaseMock,
    };
    service = new HealthService(probePort);
  });

  it('retorna { status: "ok", database: "up" } cuando PostgreSQL responde', async () => {
    pingDatabaseMock.mockResolvedValue(undefined);

    const result = await service.checkHealth();

    expect(result).toEqual({ status: 'ok', database: 'up' });
    expect(pingDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('lanza DomainError 503 SERVICE_UNAVAILABLE cuando falla la conexión a BD', async () => {
    pingDatabaseMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.checkHealth()).rejects.toThrow(DomainError);

    try {
      await service.checkHealth();
    } catch (error) {
      const domainError = error as DomainError;
      expect(domainError.statusCode).toBe(503);
      expect(domainError.code).toBe('SERVICE_UNAVAILABLE');
      expect(domainError.details).toEqual({ database: 'down' });
    }
  });
});
