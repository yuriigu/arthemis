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
import { CreateObservationDto } from './dto/create-observation.dto.js';
import { FindObservationsQueryDto } from './dto/find-observations-query.dto.js';
import { UpdateObservationDto } from './dto/update-observation.dto.js';
import type { PublicObservation } from './models/i-observation.js';
import { ObservationsService } from './observations.service.js';

@Controller('observations')
@ApiTags('observations')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Observation created.' })
  async create(@Body() dto: CreateObservationDto): Promise<PublicObservation> {
    return this.observationsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of observations.' })
  async findAll(
    @Query() query: FindObservationsQueryDto,
  ): Promise<PublicObservation[]> {
    return this.observationsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Observation details.' })
  @ApiNotFoundResponse({ description: 'Observation not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicObservation> {
    return this.observationsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Observation updated.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateObservationDto,
  ): Promise<PublicObservation> {
    return this.observationsService.update(id, dto);
  }
}
