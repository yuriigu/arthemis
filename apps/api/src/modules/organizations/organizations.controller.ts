import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { AUTH_COOKIE_NAME } from '../../auth/auth.constants.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import type {
  PaginatedOrganizationsResponse,
  PublicOrganization,
} from './models/i-organization.js';
import { OrganizationsService } from './organizations.service.js';

/**
 * Rotas de organizações.
 *
 * O legado expunha `/organization/*` no brain (sem plural, com `create`/`update`/
 * `delete` no path); aqui o recurso é `/organizations` (plural, REST), seguindo o
 * mesmo padrão de `/users` e `/auth`.
 *
 * **Todas as rotas são protegidas pelo `JwtAuthGuard`** (guard no controller, não
 * por rota): no legado o gateway Traefik aplicava `forwardAuth` equivalente em
 * todo o brain; aqui a proteção passa a ser explícita na aplicação.
 */
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiTags('organizations')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * GET /organizations — lista organizações ativas com busca e paginação.
   */
  @Get()
  @ApiOkResponse({ description: 'Paginated list of active organizations.' })
  async findAll(
    @Query() query: ListOrganizationsQueryDto,
  ): Promise<PaginatedOrganizationsResponse> {
    return this.organizationsService.findAll(query);
  }

  /** POST /organizations — 201 com a organização; 409 se o e-mail já existe. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Organization created.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<PublicOrganization> {
    return this.organizationsService.create(dto);
  }

  /** GET /organizations/:id — 400 para id que não é UUID, 404 quando não existe. */
  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Organization details.' })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicOrganization> {
    return this.organizationsService.findById(id);
  }

  /** PATCH /organizations/:id — atualização parcial; 404/409 como no POST. */
  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Organization updated.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<PublicOrganization> {
    return this.organizationsService.update(id, dto);
  }

  /**
   * DELETE /organizations/:id — soft delete (204 sem corpo).
   *
   * 404 quando não existe e 409 quando há projetos ou usuários vinculados.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Organization soft-deleted.' })
  @ApiNotFoundResponse({ description: 'Organization not found.' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.organizationsService.remove(id);
  }
}
