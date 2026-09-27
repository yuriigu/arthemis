import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import type { HealthCheck, HealthCheckResult } from './models/i-health.js';

/** Timeout máximo do ping no banco — mesmo valor usado no `auth` legado. */
const DATABASE_PING_TIMEOUT_MS = 2_000;

const DEFAULT_SERVICE_NAME = 'arthemis-api';
const DATABASE_UP_MESSAGE = 'database connection is healthy';
const DATABASE_UNAVAILABLE_MESSAGE = 'database is unavailable';

/** Tamanho máximo da mensagem devolvida no healthcheck. */
const MAX_MESSAGE_LENGTH = 200;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  private readonly serviceName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.serviceName = this.configService.get<string>(
      'SERVICE_NAME',
      DEFAULT_SERVICE_NAME,
    );
  }

  /**
   * Executa os checks de dependências e monta a resposta no contrato legado.
   * Nunca lança: uma falha no banco vira `503 degraded` em vez de um 500.
   */
  async check(): Promise<HealthCheckResult> {
    const database = await this.checkDatabase();
    const isHealthy = database.status === 'up';

    return {
      statusCode: isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
      body: {
        status: isHealthy ? 'ok' : 'degraded',
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        checks: { database },
      },
    };
  }

  /** Ping real no banco (`SELECT 1`) com timeout de 2 segundos. */
  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await this.pingDatabase();
      return { status: 'up', message: DATABASE_UP_MESSAGE };
    } catch (error) {
      const message = describeDatabaseError(error);
      this.logger.error(`Database healthcheck failed: ${message}`);

      return { status: 'down', message };
    }
  }

  private async pingDatabase(): Promise<void> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  `database ping timed out after ${DATABASE_PING_TIMEOUT_MS}ms`,
                ),
              ),
            DATABASE_PING_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Causa do erro de driver adapter reportada pelo Prisma (código P2010). */
interface DriverAdapterErrorCause {
  kind?: string;
  host?: string;
  port?: number;
  originalMessage?: string;
}

interface ErrorWithDriverAdapterMeta {
  meta?: {
    driverAdapterError?: {
      cause?: DriverAdapterErrorCause;
    };
  };
}

/**
 * Monta uma mensagem curta (uma única linha) para o check de banco.
 *
 * O Prisma devolve mensagens multilinha com detalhes do driver; aqui damos
 * preferência à causa específica (`meta.driverAdapterError.cause`) para que o
 * JSON do healthcheck continue legível.
 */
function describeDatabaseError(error: unknown): string {
  const cause = (error as ErrorWithDriverAdapterMeta | null)?.meta
    ?.driverAdapterError?.cause;

  if (cause?.originalMessage) {
    return truncate(
      `database ping failed: ${collapseWhitespace(cause.originalMessage)}`,
    );
  }

  if (cause?.host) {
    const address = cause.port ? `${cause.host}:${cause.port}` : cause.host;

    return `database is unreachable at ${address}`;
  }

  if (error instanceof Error && error.message) {
    return truncate(collapseWhitespace(error.message));
  }

  return DATABASE_UNAVAILABLE_MESSAGE;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string): string {
  if (value.length <= MAX_MESSAGE_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}
