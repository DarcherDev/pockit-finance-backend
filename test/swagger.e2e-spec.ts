import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { configureSwagger } from '../src/common/bootstrap/configure-swagger';

interface OpenApiDocumentBody {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  paths: Record<string, unknown>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
}

describe('Swagger / OpenAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, '');
    configureSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/docs responde 200 OK con HTML de Swagger UI sin requerir JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('Swagger UI');
  });

  it('GET /api/docs-json responde 200 OK con especificación OpenAPI válida y completa', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const spec = response.body as OpenApiDocumentBody;

    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info).toMatchObject({
      title: 'Pockit Finance API',
      description:
        'API RESTful para el ecosistema Pockit Finance (Auth, Usuarios, Cuentas y Auditoría)',
      version: '1.0.0',
    });

    expect(spec.components?.securitySchemes).toHaveProperty('bearer');
    expect(spec.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    const paths = Object.keys(spec.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api',
        '/api/health',
        '/api/auth/registro',
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/auth/recuperar-password',
        '/api/auth/restablecer-password',
        '/api/usuarios/me',
        '/api/cuentas',
        '/api/cuentas/{padreId}/subcuentas',
        '/api/cuentas/{id}/detalle',
        '/api/cuentas/{id}',
      ]),
    );

    expect(spec.components?.schemas).toHaveProperty('ErrorResponse');
  });
});
