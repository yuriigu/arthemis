import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { ProponentsModule } from './modules/proponents/proponents.module.js';
import { SdgsModule } from './modules/sdgs/sdgs.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Carrega o .env e valida as variáveis no boot: se faltar algo obrigatório
    // (ex.: DATABASE_URL) a aplicação não sobe.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      // Validação via Standard Schema (zod): sem DATABASE_URL a API não sobe.
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    // Módulo de proponentes: CRUD + listagem para seletores, com JwtAuthGuard.
    ProponentsModule,
    // Módulo de ODS: listagem dos 17 Objetivos de Desenvolvimento Sustentável.
    SdgsModule,
    // Módulo de projetos: criação transacional, listagem paginada, edição e exclusão.
    ProjectsModule,
    // AuthModule depois do UsersModule: importa UsersModule para o login
    // reutilizar o findByEmail (bcrypt.compare) e registra o JwtModule.
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
