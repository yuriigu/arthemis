import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { IndicatorsController } from './indicators.controller.js';
import { IndicatorsRepository } from './indicators.repository.js';
import { IndicatorsService } from './indicators.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [IndicatorsController],
  providers: [IndicatorsService, IndicatorsRepository],
  exports: [IndicatorsService],
})
export class IndicatorsModule {}
