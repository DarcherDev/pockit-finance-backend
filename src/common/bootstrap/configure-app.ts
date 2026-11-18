import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

const DEFAULT_CORS_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
];

const LOCALHOST_PORT_ORIGIN_REGEX = /^http:\/\/localhost:\d+$/;

export const ALLOWED_CORS_METHODS = [
  'GET',
  'POST',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

export const ALLOWED_CORS_HEADERS = ['Authorization', 'Content-Type', 'Accept'];

export type CorsOriginCallback = (
  err: Error | null,
  allow?: boolean,
) => void;

export const parseCorsOrigins = (corsOriginsRaw = ''): string[] => {
  const extraOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return Array.from(new Set([...DEFAULT_CORS_ORIGINS, ...extraOrigins]));
};

export const createCorsOriginValidator = (
  allowedOrigins: string[],
  allowLocalhostPorts = process.env.NODE_ENV !== 'production',
) => {
  const allowedSet = new Set(allowedOrigins);

  return (
    requestOrigin: string | undefined,
    callback: CorsOriginCallback,
  ): void => {
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    if (allowedSet.has(requestOrigin)) {
      callback(null, true);
      return;
    }

    if (allowLocalhostPorts && LOCALHOST_PORT_ORIGIN_REGEX.test(requestOrigin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
};

export const configureApp = (
  app: INestApplication,
  corsOriginsRaw = '',
): void => {
  app.setGlobalPrefix('api');

  const allowedOrigins = parseCorsOrigins(corsOriginsRaw);

  app.enableCors({
    origin: createCorsOriginValidator(allowedOrigins),
    methods: ALLOWED_CORS_METHODS,
    allowedHeaders: ALLOWED_CORS_HEADERS,
    credentials: true,
    optionsSuccessStatus: 204,
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
