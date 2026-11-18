import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { configureApp, parseCorsOrigins } from './configure-app';

describe('configureApp & parseCorsOrigins', () => {
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

  it('configura prefijo /api, CORS, ValidationPipe y AllExceptionsFilter en INestApplication', () => {
    const app = {
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
    } as unknown as INestApplication;

    configureApp(app, 'https://app.pockit.finance');

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(app.enableCors).toHaveBeenCalledWith({
      origin: [
        'capacitor://localhost',
        'https://localhost',
        'http://localhost',
        'https://app.pockit.finance',
      ],
      credentials: true,
    });
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(app.useGlobalFilters).toHaveBeenCalledWith(
      expect.any(AllExceptionsFilter),
    );
  });
});
