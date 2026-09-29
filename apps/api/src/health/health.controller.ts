import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service.js';
import type { HealthCheckResponse } from './models/i-health.js';

@Controller('healthcheck')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /healthcheck
   *
   * - 200 + `status: "ok"` quando o banco responde ao ping;
   * - 503 + `status: "degraded"` quando o banco está fora ou não responde em 2s.
   */
  @Get()
  async check(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthCheckResponse> {
    const { statusCode, body } = await this.healthService.check();

    response.status(statusCode);

    return body;
  }
}
