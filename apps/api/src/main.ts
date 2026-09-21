import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './config/app.setup.js';

/**
 * Porta default da API: 8081, mantida por compatibilidade com o gateway
 * Traefik legado. Pode ser sobrescrita pela variável de ambiente PORT.
 */
const DEFAULT_PORT = 8081;

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe global (whitelist/forbidNonWhitelisted/transform).
  configureApp(app);

  // Garante que o onModuleDestroy (fechamento do pool do Prisma) seja chamado
  // em SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('PORT', DEFAULT_PORT);

  await app.listen(port);
  logger.log(`Arthemis API is running on http://localhost:${port}`);
}

try {
  await bootstrap();
} catch (error) {
  // Fail-fast: sem banco de dados (ou com env inválido) a API não sobe.
  logger.error(
    'Failed to start the API. Shutting down.',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
}
