import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

/**
 * Módulo raiz (Root Module) da aplicação NestJS.
 *
 * É o ponto de entrada da árvore de dependências do NestJS.
 * Todos os módulos de domínio (como Auth, Prisma, etc.) são importados e registrados aqui.
 */
@Module({
  imports: [
    // Módulo global de acesso ao banco de dados PostgreSQL via Prisma ORM
    PrismaModule,

    // Módulo de autenticação (login, geração e validação de tokens JWT)
    AuthModule,
  ],
  controllers: [
    // Controller padrão da rota raiz
    AppController,
  ],
  providers: [
    // Serviço com a regra de negócio do AppController
    AppService,
  ],
})
export class AppModule {}
