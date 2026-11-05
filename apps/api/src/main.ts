import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');
  const prefix = configService.getOrThrow<string>('app.prefix');
  const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');

  if (prefix) {
    app.setGlobalPrefix(prefix);
  }
  app.enableCors({ origin: corsOrigins });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Arthemis API')
    .setDescription('Arthemis backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  await app.listen(port);
}
bootstrap();
