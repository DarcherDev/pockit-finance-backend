import { INestApplication } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { configureSwagger } from './configure-swagger';

describe('configureSwagger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('construye la especificación OpenAPI y monta Swagger UI en api/docs y api/docs-json', () => {
    const app = {} as INestApplication;
    const mockDocument = { openapi: '3.0.0', info: { title: 'Pockit Finance API' } } as OpenAPIObject;

    const createDocumentSpy = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue(mockDocument);
    const setupSpy = jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(() => undefined);

    configureSwagger(app);

    expect(createDocumentSpy).toHaveBeenCalledTimes(1);
    const [calledApp, calledConfig] = createDocumentSpy.mock.calls[0];
    expect(calledApp).toBe(app);
    expect(calledConfig.info).toMatchObject({
      title: 'Pockit Finance API',
      description:
        'API RESTful para el ecosistema Pockit Finance (Auth, Usuarios, Cuentas y Auditoría)',
      version: '1.0.0',
    });
    expect(calledConfig.components?.securitySchemes).toMatchObject({
      bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT emitido por Supabase Auth',
      },
    });

    expect(setupSpy).toHaveBeenCalledWith('api/docs', app, mockDocument, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  });
});
