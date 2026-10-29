import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsRepository } from './organizations.repository.js';
import { OrganizationsService } from './organizations.service.js';

/**
 * Módulo de organizações: model `Organization` (tabela `organizations`), CRUD e a
 * listagem para seletores.
 *
 * - `PrismaModule` fornece o `PrismaService` (é `@Global`, mas a importação
 *   explícita segue o padrão do `UsersModule`);
 * - `PassportModule.register` provê o token `AuthModuleOptions` exigido pelo
 *   `AuthGuard()` do `@nestjs/passport` v12, injetado no `JwtAuthGuard` usado
 *   pelo controller. A estratégia `jwt` em si é registrada pelo `AuthModule`
 *   (`JwtStrategy`), que precisa estar carregado pelo módulo raiz;
 * - `OrganizationsService` é exportado para futuros módulos (ex.: `projects`)
 *   reutilizarem as regras de vínculo.
 */
@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService, OrganizationsRepository],
})
export class OrganizationsModule {}
