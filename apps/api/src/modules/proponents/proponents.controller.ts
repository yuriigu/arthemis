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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateProponentDto } from './dto/create-proponent.dto.js';
import { ListProponentsQueryDto } from './dto/list-proponents-query.dto.js';
import { UpdateProponentDto } from './dto/update-proponent.dto.js';
import type { PublicProponent } from './models/i-proponent.js';
import { ProponentsService } from './proponents.service.js';

/**
 * Rotas de proponentes.
 *
 * O legado expunha `/proponent/*` no brain (sem plural, com `create`/`update`/
 * `delete` no path); aqui o recurso é `/proponents` (plural, REST), seguindo o
 * mesmo padrão de `/users` e `/auth`.
 *
 * **Todas as rotas são protegidas pelo `JwtAuthGuard`** (guard no controller, não
 * por rota): no legado o gateway Traefik aplicava `forwardAuth` equivalente em
 * todo o brain; aqui a proteção passa a ser explícita na aplicação.
 */
@Controller('proponents')
@UseGuards(JwtAuthGuard)
export class ProponentsController {
  constructor(private readonly proponentsService: ProponentsService) {}

  /**
   * GET /proponents?search= — lista enxuta (sem paginação) para
   * seletores/dropdowns da UI. Sem registros devolve `200 []`.
   */
  @Get()
  async findAll(
    @Query() query: ListProponentsQueryDto,
  ): Promise<PublicProponent[]> {
    return this.proponentsService.findAll(query);
  }

  /** POST /proponents — 201 com o proponente; 409 se o e-mail já existe. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProponentDto): Promise<PublicProponent> {
    return this.proponentsService.create(dto);
  }

  /** GET /proponents/:id — 400 para id que não é UUID, 404 quando não existe. */
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicProponent> {
    return this.proponentsService.findById(id);
  }

  /** PATCH /proponents/:id — atualização parcial; 404/409 como no POST. */
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProponentDto,
  ): Promise<PublicProponent> {
    return this.proponentsService.update(id, dto);
  }

  /**
   * DELETE /proponents/:id — soft delete (204 sem corpo).
   *
   * 404 quando não existe e 409 quando há projetos ou usuários vinculados.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.proponentsService.remove(id);
  }
}
