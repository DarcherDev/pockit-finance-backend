import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/presentation/decorators/public.decorator';

@ApiTags('General')
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Endpoint raíz de bienvenida de la API' })
  @ApiOkResponse({
    description: 'Mensaje de bienvenida',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
