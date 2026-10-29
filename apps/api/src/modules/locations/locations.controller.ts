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
import { CreateLocationDto } from './dto/create-location.dto.js';
import { FindLocationsQueryDto } from './dto/find-locations-query.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import type { PublicLocation } from './models/i-location.js';
import { LocationsService } from './locations.service.js';

@Controller('locations')
@ApiTags('locations')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Location created.' })
  async create(@Body() dto: CreateLocationDto): Promise<PublicLocation> {
    return this.locationsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of locations.' })
  async findAll(
    @Query() query: FindLocationsQueryDto,
  ): Promise<PublicLocation[]> {
    return this.locationsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Location details.' })
  @ApiNotFoundResponse({ description: 'Location not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicLocation> {
    return this.locationsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Location updated.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<PublicLocation> {
    return this.locationsService.update(id, dto);
  }
}
