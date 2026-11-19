import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const configureSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Pockit Finance API')
    .setDescription(
      'API RESTful para el ecosistema Pockit Finance (Auth, Usuarios, Cuentas y Auditoría)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT emitido por Supabase Auth',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
