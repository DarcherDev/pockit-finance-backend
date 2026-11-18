import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

const DEFAULT_CORS_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
];

export const parseCorsOrigins = (corsOriginsRaw = ''): string[] => {
  const extraOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return Array.from(new Set([...DEFAULT_CORS_ORIGINS, ...extraOrigins]));
};

export const configureApp = (
  app: INestApplication,
  corsOriginsRaw = '',
): void => {
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: parseCorsOrigins(corsOriginsRaw),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
};
