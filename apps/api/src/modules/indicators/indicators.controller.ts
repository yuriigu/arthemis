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
import { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import { FindIndicatorsQueryDto } from './dto/find-indicators-query.dto.js';
import { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import type { PublicIndicator } from './models/i-indicator.js';
import { IndicatorsService } from './indicators.service.js';

@Controller('indicators')
@ApiTags('indicators')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Indicator created.' })
  async create(@Body() dto: CreateIndicatorDto): Promise<PublicIndicator> {
    return this.indicatorsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List of indicators.' })
  async findAll(
    @Query() query: FindIndicatorsQueryDto,
  ): Promise<PublicIndicator[]> {
    return this.indicatorsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Indicator details.' })
  @ApiNotFoundResponse({ description: 'Indicator not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicIndicator> {
    return this.indicatorsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Indicator updated.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIndicatorDto,
  ): Promise<PublicIndicator> {
    return this.indicatorsService.update(id, dto);
  }
}
