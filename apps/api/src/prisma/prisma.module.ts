import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Módulo global de acesso ao banco: o PrismaService é compartilhado por todos
 * os módulos de domínio (proponents, projects, activities, ...) sem a
 * necessidade de reimportar o módulo em cada feature.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
