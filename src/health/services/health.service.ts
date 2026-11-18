import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';
import { HealthResponse } from '../dto/response/health.response';
import { HealthRepository } from '../repositories/health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async checkHealth(): Promise<HealthResponse> {
    try {
      await this.healthRepository.pingDatabase();
      return {
        status: 'ok',
        database: 'up',
      };
    } catch {
      throw new DomainException(
        'SERVICE_UNAVAILABLE',
        'No se pudo establecer conexión con la base de datos',
        HttpStatus.SERVICE_UNAVAILABLE,
        { database: 'down' },
      );
    }
  }
}
