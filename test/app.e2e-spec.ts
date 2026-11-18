import {
  Body,
  Controller,
  Get,
  HttpStatus,
  INestApplication,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/common/bootstrap/configure-app';
import { DomainException } from './../src/common/exceptions/domain.exception';
import { HealthController } from './../src/health/controllers/health.controller';
import { HealthRepository } from './../src/health/repositories/health.repository';
import { HealthService } from './../src/health/services/health.service';

class QaValidationDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}

@Controller('__qa-test__')
class QaIntegrationController {
  @Post('validate')
  validate(@Body() dto: QaValidationDto) {
    return {
      name: dto.name,
      amount: dto.amount,
      amountType: typeof dto.amount,
    };
  }

  @Get('domain-error')
  domainError(): never {
    throw new DomainException(
      'QA_DOMAIN_ERROR',
      'Regla de dominio violada',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { field: 'amount' },
    );
  }

  @Get('http-error')
  httpError(): never {
    throw new NotFoundException('Recurso QA no encontrado');
  }

  @Get('unhandled-error')
  unhandledError(): never {
    throw new Error('SECRET_DB_PASSWORD_LEAK_DO_NOT_EXPOSE');
  }
}

describe('HU-01.1 Bootstrap & Health (e2e)', () => {
  describe('AppModule completo con configureApp', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      configureApp(app, 'https://app.pockit.finance');
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api responde 200 OK respetando el prefijo global /api', async () => {
      await request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect('Hello World!');
    });

    it('GET / sin prefijo /api responde 404 con formato uniforme', async () => {
      const response = await request(app.getHttpServer()).get('/').expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
        details: null,
      });
    });

    it('GET /api/health responde 200 OK con { status: "ok", database: "up" }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        database: 'up',
      });
    });

    it.each([
      'capacitor://localhost',
      'https://localhost',
      'http://localhost',
      'https://app.pockit.finance',
    ])(
      'CORS permite origen autorizado %s en preflight OPTIONS',
      async (origin) => {
        const response = await request(app.getHttpServer())
          .options('/api/health')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET')
          .expect(204);

        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe(
          'true',
        );
      },
    );

    it('OPTIONS preflight desde capacitor://localhost devuelve métodos y headers CORS explícitos', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'capacitor://localhost')
        .set('Access-Control-Request-Method', 'PATCH')
        .set(
          'Access-Control-Request-Headers',
          'Authorization, Content-Type, Accept',
        )
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe(
        'capacitor://localhost',
      );
      expect(response.headers['access-control-allow-methods']).toBe(
        'GET,POST,PATCH,DELETE,OPTIONS',
      );
      expect(response.headers['access-control-allow-headers']).toBe(
        'Authorization,Content-Type,Accept',
      );
    });

    it('OPTIONS preflight desde origen no permitido rechaza CORS sin romper el servidor', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'https://evil.example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(500);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('CORS no autoriza orígenes no permitidos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://evil.example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('GET /api/health cuando falla la base de datos', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const failingRepository = {
        pingDatabase: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED postgres')),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
        providers: [
          HealthService,
          {
            provide: HealthRepository,
            useValue: failingRepository,
          },
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      configureApp(app, '');
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('responde 503 SERVICE_UNAVAILABLE con details { database: "down" }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(503);

      expect(response.body).toEqual({
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'No se pudo establecer conexión con la base de datos',
        details: { database: 'down' },
      });
    });
  });

  describe('ValidationPipe y AllExceptionsFilter sobre HTTP', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [QaIntegrationController],
      }).compile();

      app = moduleFixture.createNestApplication();
      configureApp(app, '');
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('ValidationPipe transforma y acepta payload válido', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/__qa-test__/validate')
        .send({ name: 'Cuenta Principal', amount: '125.5' })
        .expect(201);

      expect(response.body).toEqual({
        name: 'Cuenta Principal',
        amount: 125.5,
        amountType: 'number',
      });
    });

    it('ValidationPipe rechaza campos no declarados (forbidNonWhitelisted) con 400 VALIDATION_ERROR', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/__qa-test__/validate')
        .send({ name: 'Cuenta', amount: 100, extraField: 'hack' })
        .expect(400);

      const body = response.body as {
        statusCode: number;
        code: string;
        message: string;
        details: unknown;
      };
      expect(body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
      });
      expect(body.details).toEqual(
        expect.arrayContaining(['property extraField should not exist']),
      );
    });

    it('ValidationPipe rechaza payload vacío con 400 VALIDATION_ERROR', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/__qa-test__/validate')
        .send({})
        .expect(400);

      const body = response.body as {
        statusCode: number;
        code: string;
        message: string;
        details: unknown;
      };
      expect(body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
      });
      expect(Array.isArray(body.details)).toBe(true);
    });

    it('AllExceptionsFilter formatea DomainException con { statusCode, code, message, details }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/__qa-test__/domain-error')
        .expect(422);

      expect(response.body).toEqual({
        statusCode: 422,
        code: 'QA_DOMAIN_ERROR',
        message: 'Regla de dominio violada',
        details: { field: 'amount' },
      });
    });

    it('AllExceptionsFilter formatea HttpException estándar', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/__qa-test__/http-error')
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Recurso QA no encontrado',
        details: null,
      });
    });

    it('AllExceptionsFilter formatea errores no controlados como 500 sin filtrar stack ni secretos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/__qa-test__/unhandled-error')
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
        details: null,
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'SECRET_DB_PASSWORD_LEAK_DO_NOT_EXPOSE',
      );
    });
  });
});
