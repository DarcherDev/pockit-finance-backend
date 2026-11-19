import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/domain';
import { HealthStatus } from '../../domain/model/health-status.model';
import { HEALTH_PROBE_PORT } from '../../domain/ports/out/health-probe.port';
import type { HealthProbePort } from '../../domain/ports/out/health-probe.port';
import { HealthResponse } from '../../presentation/dto/response/health.response';

@Injectable()
export class HealthService {
  constructor(
    @Inject(HEALTH_PROBE_PORT)
    private readonly healthProbePort: HealthProbePort,
  ) {}

  async checkHealth(): Promise<HealthResponse> {
    try {
      await this.healthProbePort.pingDatabase();
      const status: HealthStatus = {
        status: 'ok',
        database: 'up',
      };
      return status;
    } catch {
      throw new DomainError(
        'SERVICE_UNAVAILABLE',
        'No se pudo establecer conexión con la base de datos',
        503,
        { database: 'down' },
      );
    }
  }
}
