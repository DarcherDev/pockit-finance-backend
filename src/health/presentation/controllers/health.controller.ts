import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { HealthService } from '../../application/services/health.service';
import { HealthResponse } from '../dto/response/health.response';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.checkHealth();
  }
}
