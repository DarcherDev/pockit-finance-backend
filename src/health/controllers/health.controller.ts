import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '../dto/response/health.response';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.checkHealth();
  }
}
