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
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('location')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(202)
  create(
    @Body(
      new ParseArrayPipe({
        items: CreateLocationDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createLocationDto: CreateLocationDto[],
  ) {
    return this.locationsService.create(createLocationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
