import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigin = isDev
    ? ['http://localhost:3000', 'http://localhost:3001', 'https://vessel-dev.kallagroup.co.id']
    : ['https://vessel.kallatranslog.co.id', 'https://vessel-dev.kallagroup.co.id'];
  // console.log('allowedOrigin', allowedOrigin);
  app.enableCors({
    // origin: ['http://localhost:3000', 'http://localhost:3001', 'https://vessel-dev.kallagroup.co.id'],
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  });

  Sentry.init({
    dsn: 'https://2aaea516f9bf484699815f43d887cb6f@o4504490576576512.ingest.sentry.io/4504726997630976',
    tracesSampleRate: 1.0,
  });

  // if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder().setTitle('Vessel Project').setDescription('Vessel API Documentation').setVersion('1.0').addTag('vessel').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
    },
  });
  // }

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  await app.listen(3000);
}
bootstrap();
