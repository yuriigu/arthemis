import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { SdgsModule } from '../sdgs/sdgs.module.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';

/**
 * Módulo de gerenciamento de projetos socioambientais (Issue #28).
 *
 * Integra criação transacional com organizações e ODS, listagem paginada,
 * detalhamento, atualização parcial e exclusão lógica (soft delete).
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OrganizationsModule,
    SdgsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
