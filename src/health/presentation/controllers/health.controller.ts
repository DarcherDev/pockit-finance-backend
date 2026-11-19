import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { ErrorResponse } from '../../../common/dto/error.response';
import { HealthService } from '../../application/services/health.service';
import { HealthResponse } from '../dto/response/health.response';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar estado de salud de la API y base de datos',
  })
  @ApiOkResponse({
    description: 'Servicio y base de datos operativos',
    type: HealthResponse,
  })
  @ApiServiceUnavailableResponse({
    description: 'Base de datos no disponible',
    type: ErrorResponse,
  })
  check(): Promise<HealthResponse> {
    return this.healthService.checkHealth();
  }
}
