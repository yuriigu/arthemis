import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SdgsService } from './sdgs.service';
import { CreateSdgDto } from './dto/create-sdg.dto';
import { UpdateSdgDto } from './dto/update-sdg.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('sdg')
export class SdgsController {
  constructor(private readonly sdgsService: SdgsService) {}

  @Post('create')
  @Roles(UserRole.ADMIN)
  create(@Body() createSdgDto: CreateSdgDto) {
    return this.sdgsService.create(createSdgDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    // O Frontend (listSdgs) espera um array de { ID, Name, Number, IconURL }
    return this.sdgsService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sdgsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateSdgDto: UpdateSdgDto) {
    return this.sdgsService.update(id, updateSdgDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.sdgsService.remove(id);
  }
}
