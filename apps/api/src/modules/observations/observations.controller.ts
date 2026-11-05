import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { ObservationsService } from './observations.service';

@Controller('observation')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.observationsService.findAll(pagination);
  }

  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(202)
  create(
    @Body(
      new ParseArrayPipe({
        items: CreateObservationDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createObservationDto: CreateObservationDto[],
  ) {
    return this.observationsService.create(createObservationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.observationsService.findOne(id);
  }

  @Patch('update/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateObservationDto: UpdateObservationDto,
  ) {
    return this.observationsService.update(id, updateObservationDto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.observationsService.remove(id);
  }
}
