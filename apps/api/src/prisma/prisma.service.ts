import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Limites do pool de conexões repassados ao driver `pg`.
 *
 * O Prisma 7 exige um driver adapter em runtime e usa os defaults do `pg`
 * (sem timeout de conexão). Os valores abaixo espelham o SetMaxOpenConns(25)/
 * SetMaxIdleConns(10) dos serviços legados em Go, com um limite mais enxuto
 * para o pool da API.
 */
const POOL_OPTIONS = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
} as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.getOrThrow<string>('DATABASE_URL'),
        ...POOL_OPTIONS,
      }),
    });
  }

  /**
   * Abre a conexão durante o boot. Como o `$connect()` do Prisma 7 com driver
   * adapter é preguiçoso (não falha se o banco estiver fora), um `SELECT 1` é
   * executado em seguida: assim a aplicação só sobe com o banco realmente
   * acessível (fail-fast) — diferente do `brain` legado, que apenas logava a
   * falha e continuava rodando.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.assertDatabaseIsReachable();
    this.logger.log('Database connection established');
  }

  /**
   * Fecha o pool ao encerrar a aplicação. Requer `app.enableShutdownHooks()`
   * no bootstrap para reagir a SIGTERM/SIGINT.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Ping de boot. O timeout é o `connectionTimeoutMillis` do pool (5s), então
   * hosts inacessíveis falham rápido em vez de pendurar o bootstrap.
   */
  private async assertDatabaseIsReachable(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new Error(
        'Database is unreachable during startup: the API will not boot (fail-fast).',
        { cause: error },
      );
    }
  }
}
