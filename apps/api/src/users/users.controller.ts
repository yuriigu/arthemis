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
  async create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.createUser(dto);
  }

  /** GET /users/:id — 400 para id que não é UUID, 404 quando não existe. */
  @Get(':id')
  @Roles(Role.ADMIN)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicUser> {
    return this.usersService.findById(id);
  }
}
