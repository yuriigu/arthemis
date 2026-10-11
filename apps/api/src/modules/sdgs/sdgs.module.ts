import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SdgsController } from './sdgs.controller.js';
import { SdgsRepository } from './sdgs.repository.js';
import { SdgsService } from './sdgs.service.js';

/**
 * Módulo de Objetivos de Desenvolvimento Sustentável (ODS):
 * Gerencia a consulta aos 17 ODS da ONU e provê validação para projetos associados.
 */
@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [SdgsController],
  providers: [SdgsService, SdgsRepository],
  exports: [SdgsService, SdgsRepository],
})
export class SdgsModule {}
