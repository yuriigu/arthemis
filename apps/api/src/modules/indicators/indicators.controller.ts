import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  ParseArrayPipe,
  Query,
} from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('indicator')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(202)
  create(
    @Body(
      new ParseArrayPipe({
        items: CreateIndicatorDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createIndicatorDto: CreateIndicatorDto[],
  ) {
    return this.indicatorsService.create(createIndicatorDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.indicatorsService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateIndicatorDto: UpdateIndicatorDto,
  ) {
    return this.indicatorsService.update(id, updateIndicatorDto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.indicatorsService.remove(id);
  }
}
