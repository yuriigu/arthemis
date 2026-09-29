import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

/**
 * Módulo de usuários: model `User` (tabela `users`), criação e consultas.
 *
 * `UsersService` é exportado para o futuro módulo de autenticação reutilizar
 * `findByEmail` (o login legado fazia `WHERE username = ?` + `bcrypt.compare`).
 */
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
