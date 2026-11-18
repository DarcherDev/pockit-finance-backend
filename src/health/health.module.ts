import { Module } from '@nestjs/common';
import { HealthService } from './application/services/health.service';
import { HEALTH_PROBE_PORT } from './domain/ports/out/health-probe.port';
import { HealthRepository } from './infrastructure/persistence/health.repository';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    HealthRepository,
    {
      provide: HEALTH_PROBE_PORT,
      useExisting: HealthRepository,
    },
  ],
})
export class HealthModule {}
