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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProponentDto } from './dto/add-proponent.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('project')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(202) // Replicando o StatusAccepted do Go
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.projectsService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Put('update/:id') // O Go usava PUT
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/add_proponent')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  addProponent(
    @Param('id') id: string,
    @Body(
      new ParseArrayPipe({
        items: AddProponentDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    addProponentDto: AddProponentDto[],
  ) {
    return this.projectsService.addProponents(id, addProponentDto);
  }

  @Delete(':projectId/remove_proponent/:proponentId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeProponent(
    @Param('projectId') projectId: string,
    @Param('proponentId') proponentId: string,
  ) {
    return this.projectsService.removeProponent(projectId, proponentId);
  }
}
