import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
