import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import {
  ALLOWED_CORS_HEADERS,
  ALLOWED_CORS_METHODS,
  configureApp,
  createCorsOriginValidator,
  parseCorsOrigins,
} from './configure-app';

describe('configureApp & CORS', () => {
  describe('parseCorsOrigins', () => {
    it('incluye orígenes de CapacitorJS y localhost por defecto', () => {
      const origins = parseCorsOrigins('');

      expect(origins).toEqual([
        'capacitor://localhost',
        'https://localhost',
        'http://localhost',
      ]);
    });

    it('agrega orígenes configurados en CORS_ORIGINS separados por coma sin duplicados', () => {
      const origins = parseCorsOrigins(
        'https://app.pockit.finance, http://localhost:5173 , http://localhost ',
      );

      expect(origins).toEqual([
        'capacitor://localhost',
        'https://localhost',
        'http://localhost',
        'https://app.pockit.finance',
        'http://localhost:5173',
      ]);
    });
  });

  describe('createCorsOriginValidator', () => {
    const allowedOrigins = parseCorsOrigins('https://app.pockit.finance');

    it('permite peticiones sin header Origin (curl / healthchecks)', () => {
      const validator = createCorsOriginValidator(allowedOrigins, false);
      const callback = jest.fn();

      validator(undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it.each([
      'capacitor://localhost',
      'https://localhost',
      'http://localhost',
      'https://app.pockit.finance',
    ])('permite origen autorizado %s', (origin) => {
      const validator = createCorsOriginValidator(allowedOrigins, false);
      const callback = jest.fn();

      validator(origin, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('permite variantes http://localhost:<puerto> en desarrollo', () => {
      const validator = createCorsOriginValidator(allowedOrigins, true);
      const callback = jest.fn();

      validator('http://localhost:5173', callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('rechaza variantes http://localhost:<puerto> no declaradas en producción', () => {
      const validator = createCorsOriginValidator(allowedOrigins, false);
      const callback = jest.fn();

      validator('http://localhost:5173', callback);

      expect(callback).toHaveBeenCalledWith(null, false);
    });

    it('rechaza orígenes no autorizados sin lanzar error (callback(null, false))', () => {
      const validator = createCorsOriginValidator(allowedOrigins, true);
      const callback = jest.fn();

      validator('https://evil.example.com', callback);

      expect(callback).toHaveBeenCalledWith(null, false);
    });
  });

  describe('configureApp', () => {
    it('configura prefijo /api, CORS híbrido, ValidationPipe y AllExceptionsFilter en INestApplication', () => {
      const setGlobalPrefix = jest.fn();
      const enableCors = jest.fn();
      const useGlobalPipes = jest.fn();
      const useGlobalFilters = jest.fn();
      const app = {
        setGlobalPrefix,
        enableCors,
        useGlobalPipes,
        useGlobalFilters,
      } as unknown as INestApplication;

      configureApp(app, 'https://app.pockit.finance');

      expect(setGlobalPrefix).toHaveBeenCalledWith('api');
      expect(enableCors).toHaveBeenCalledWith({
        origin: expect.any(Function) as unknown,
        methods: ALLOWED_CORS_METHODS,
        allowedHeaders: ALLOWED_CORS_HEADERS,
        credentials: true,
        optionsSuccessStatus: 204,
      });
      expect(ALLOWED_CORS_METHODS).toEqual([
        'GET',
        'POST',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ]);
      expect(ALLOWED_CORS_HEADERS).toEqual([
        'Authorization',
        'Content-Type',
        'Accept',
      ]);
      expect(useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
      expect(useGlobalFilters).toHaveBeenCalledWith(
        expect.any(AllExceptionsFilter),
      );
    });
  });
});
