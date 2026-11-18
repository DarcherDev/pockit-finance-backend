import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './common/bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureApp(app, configService.get<string>('CORS_ORIGINS', ''));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
