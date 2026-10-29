import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ObservationsController } from './observations.controller.js';
import { ObservationsRepository } from './observations.repository.js';
import { ObservationsService } from './observations.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ObservationsController],
  providers: [ObservationsService, ObservationsRepository],
  exports: [ObservationsService],
})
export class ObservationsModule {}
