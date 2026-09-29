import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

/**
 * Healthcheck global da API (`GET /healthcheck`).
 *
 * Diferente do `/health` do `brain` legado — que sempre respondia 200 — este
 * endpoint faz um ping real no banco e responde 503 quando ele está fora,
 * seguindo a lógica do `edge/services/auth/handlers/health.go`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
