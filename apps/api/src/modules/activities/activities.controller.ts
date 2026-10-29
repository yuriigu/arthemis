import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '../../auth/auth.constants.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { FindActivitiesQueryDto } from './dto/find-activities-query.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import type { PublicActivity } from './models/i-activity.js';
import { ActivitiesService } from './activities.service.js';

@Controller('activities')
@ApiTags('activities')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Activity created.' })
  async create(@Body() dto: CreateActivityDto): Promise<PublicActivity> {
    return this.activitiesService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of activities.' })
  async findAll(
    @Query() query: FindActivitiesQueryDto,
  ): Promise<PublicActivity[]> {
    return this.activitiesService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activity details.' })
  @ApiNotFoundResponse({ description: 'Activity not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicActivity> {
    return this.activitiesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Activity updated.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<PublicActivity> {
    return this.activitiesService.update(id, dto);
  }
}
