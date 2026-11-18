import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: { checkHealth: jest.Mock };

  beforeEach(async () => {
    healthService = {
      checkHealth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('delega checkHealth al HealthService y retorna la respuesta', async () => {
    const expected = { status: 'ok', database: 'up' };
    healthService.checkHealth.mockResolvedValue(expected);

    const result = await controller.check();

    expect(result).toEqual(expected);
    expect(healthService.checkHealth).toHaveBeenCalledTimes(1);
  });
});
