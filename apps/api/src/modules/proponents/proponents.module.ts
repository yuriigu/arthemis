import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ProponentsController } from './proponents.controller.js';
import { ProponentsRepository } from './proponents.repository.js';
import { ProponentsService } from './proponents.service.js';

/**
 * Módulo de proponentes: model `Proponent` (tabela `proponents`), CRUD e a
 * listagem para seletores.
 *
 * - `PrismaModule` fornece o `PrismaService` (é `@Global`, mas a importação
 *   explícita segue o padrão do `UsersModule`);
 * - `PassportModule.register` provê o token `AuthModuleOptions` exigido pelo
 *   `AuthGuard()` do `@nestjs/passport` v12, injetado no `JwtAuthGuard` usado
 *   pelo controller. A estratégia `jwt` em si é registrada pelo `AuthModule`
 *   (`JwtStrategy`), que precisa estar carregado pelo módulo raiz;
 * - `ProponentsService` é exportado para futuros módulos (ex.: `projects`)
 *   reutilizarem as regras de vínculo.
 */
@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ProponentsController],
  providers: [ProponentsService, ProponentsRepository],
  exports: [ProponentsService],
})
export class ProponentsModule {}
