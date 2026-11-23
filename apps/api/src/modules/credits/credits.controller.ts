import { Body, Controller, Param, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CalculateCreditsDto } from './dto/calculate-credits.dto';
import { CreditsService } from './credits.service';

@Controller('credits')
export class CreditsController {
  constructor(private readonly service: CreditsService) {}

  @Post('calculate/:periodId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  calculate(
    @Param('periodId') periodId: string,
    @Body() dto: CalculateCreditsDto,
  ) {
    return this.service.calculate(periodId, dto.b, dto.leakage);
  }
}
