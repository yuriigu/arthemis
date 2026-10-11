import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { PublicSdg } from './models/i-sdg.js';
import { SdgsService } from './sdgs.service.js';

/**
 * Rotas para os Objetivos de Desenvolvimento Sustentável (ODS).
 *
 * Todas as rotas são protegidas pelo JwtAuthGuard, alinhadas à arquitetura do projeto.
 */
@Controller('sdgs')
@UseGuards(JwtAuthGuard)
export class SdgsController {
  constructor(private readonly sdgsService: SdgsService) {}

  /**
   * GET /sdgs — Retorna os 17 Objetivos de Desenvolvimento Sustentável da ONU cadastrados no banco.
   * A lista é ordenada deterministicamente pelo número oficial do ODS (1 a 17).
   *
   * @returns Lista de ODS ativos com seus respectivos campos completos.
   */
  @Get()
  async findAll(): Promise<PublicSdg[]> {
    return this.sdgsService.findAll();
  }
}
