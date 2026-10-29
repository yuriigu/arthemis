import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '../auth/auth.constants.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { PublicUser } from './models/i-user.js';
import { UsersService } from './users.service.js';

/**
 * Rotas de usuário.
 *
 * No legado existiam `/user/*` (brain) e `/register` (auth); aqui o recurso é
 * `/users`, no plural e em lower-kebab-case conforme o CONTRIBUTING.
 *
 * As rotas exigem autenticação globalmente; a leitura de usuário é restrita
 * adicionalmente a administradores.
 */
@Controller('users')
@ApiTags('users')
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Missing or invalid credentials.' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users — cadastro de usuário (papel `visitor`, sem senha de volta).
   *
   * Corpo: `{ "email": "...", "password": "..." }`. Campos extras são
   * rejeitados com 400 pelo ValidationPipe global.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'User created.' })
  @ApiBadRequestResponse({ description: 'Invalid request body.' })
  async create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.createUser(dto);
  }

  /** GET /users/:id — 400 para id que não é UUID, 404 quando não existe. */
  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiForbiddenResponse({ description: 'Administrator role required.' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicUser> {
    return this.usersService.findById(id);
  }
}
