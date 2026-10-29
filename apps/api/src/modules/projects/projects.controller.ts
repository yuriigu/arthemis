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
import { CreateProjectDto } from './dto/create-project.dto.js';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import type {
  PaginatedProjectsResponse,
  PublicProjectDetail,
  PublicProjectSummary,
} from './models/i-project.js';
import { ProjectsService } from './projects.service.js';

/**
 * Controller responsável pelas rotas HTTP de gerenciamento de projetos socioambientais.
 *
 * Todas as rotas são protegidas pelo JwtAuthGuard.
 */
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiTags('projects')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /projects — Cria um projeto e seus vínculos com organização principal,
   * organizações secundárias e ODS dentro de uma única transação atômica.
   *
   * @param dto Dados validados de criação do projeto.
   * @returns Projeto criado com status HTTP 201 Created.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Project created.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async create(@Body() dto: CreateProjectDto): Promise<PublicProjectDetail> {
    return this.projectsService.create(dto);
  }

  /**
   * GET /projects — Lista os projetos ativos com paginação no banco de dados e busca textual.
   *
   * @param query Parâmetros de página (page), limite (limit) e termo de busca (search).
   * @returns Envelope padronizado { data: [...], meta: { total, page, limit, totalPages } }.
   */
  @Get()
  @ApiOkResponse({ description: 'Paginated list of active projects.' })
  async findAll(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedProjectsResponse<PublicProjectSummary>> {
    return this.projectsService.findAll(query);
  }

  /**
   * GET /projects/:id — Detalhes completos de um projeto ativo.
   * Retorna os dados do projeto, organização principal, organizações associadas e ODS.
   *
   * @param id Identificador UUID do projeto.
   * @returns Projeto detalhado ou HTTP 404 se não for localizado.
   */
  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Project details.' })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicProjectDetail> {
    return this.projectsService.findById(id);
  }

  /**
   * PATCH /projects/:id — Edição parcial de dados e relacionamentos do projeto.
   * Preserva vínculos não enviados e atualiza em transação atômica.
   *
   * @param id Identificador UUID do projeto a ser atualizado.
   * @param dto Campos parciais a serem alterados.
   * @returns Projeto atualizado com status HTTP 200 OK.
   */
  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Project updated.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<PublicProjectDetail> {
    return this.projectsService.update(id, dto);
  }

  /**
   * DELETE /projects/:id — Exclusão lógica (soft delete) do projeto e seus relacionamentos ativos.
   *
   * @param id Identificador UUID do projeto a ser desativado.
   * @returns Status HTTP 204 No Content sem corpo de resposta.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Project soft-deleted.' })
  @ApiNotFoundResponse({ description: 'Project not found.' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }
}
