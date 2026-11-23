import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateMonitoringPeriodDto } from './dto/create-monitoring-period.dto';
import { MonitoringPeriodsService } from './monitoring-periods.service';

@Controller('monitoring-period')
export class MonitoringPeriodsController {
  constructor(private readonly service: MonitoringPeriodsService) {}

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateMonitoringPeriodDto) {
    return this.service.create(dto);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN)
  verify(@Param('id') id: string) {
    return this.service.verify(id);
  }
}