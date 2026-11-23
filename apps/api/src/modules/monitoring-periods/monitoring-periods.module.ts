import { Module } from '@nestjs/common';
import { MonitoringPeriodsController } from './monitoring-periods.controller';
import { MonitoringPeriodsService } from './monitoring-periods.service';

@Module({
  controllers: [MonitoringPeriodsController],
  providers: [MonitoringPeriodsService],
  exports: [MonitoringPeriodsService],
})
export class MonitoringPeriodsModule {}