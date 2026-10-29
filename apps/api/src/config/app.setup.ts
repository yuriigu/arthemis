import { Logger, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants.js';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter.js';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor.js';
import { runWithRequestId } from '../common/request-context.js';

type RequestWithContext = Request & {
  requestId?: string;
  requestLogged?: boolean;
};

const requestLogger = new Logger('LoggingInterceptor');

/**
 * Configuração de aplicação compartilhada entre o bootstrap (`main.ts`) e os
 * testes (e2e/integração), garantindo que o comportamento HTTP seja o mesmo em
 * produção e em teste.
 *
 * - `whitelist`: remove propriedades sem decorators (ex.: `role` enviado no
 *   corpo do `POST /users`).
 * - `forbidNonWhitelisted`: devolve 400 em vez de ignorar campos desconhecidos
 *   (bloqueia tentativas de escalação de privilégio via body).
 * - `transform`: habilita o `@Transform` dos DTOs (normalização de e-mail).
 */
export function configureApp(app: INestApplication): void {
  app.use(
    (
      request: RequestWithContext,
      response: Response,
      next: NextFunction,
    ): void => {
      const requestId = randomUUID();
      const startedAt = Date.now();

      request.requestId = requestId;
      response.setHeader('X-Request-Id', requestId);
      response.once('finish', () => {
        if (request.requestLogged) {
          return;
        }

        request.requestLogged = true;
        requestLogger.log(
          JSON.stringify({
            event: 'http_request',
            requestId,
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          }),
        );
      });
      runWithRequestId(requestId, () => next());
    },
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Arthemis API')
    .setDescription('API for the Arthemis platform.')
    .setVersion('1.0')
    .addCookieAuth(AUTH_COOKIE_NAME)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
