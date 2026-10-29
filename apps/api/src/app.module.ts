import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { ActivitiesModule } from './modules/activities/activities.module.js';
import { IndicatorsModule } from './modules/indicators/indicators.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { ObservationsModule } from './modules/observations/observations.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('THROTTLE_TTL', 60_000)),
          limit: Number(configService.get('THROTTLE_LIMIT', 100)),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    // Módulo de organizações: CRUD + listagem para seletores, com JwtAuthGuard.
    OrganizationsModule,
    // Módulo de ODS: listagem dos 17 Objetivos de Desenvolvimento Sustentável.
    SdgsModule,
    // Módulo de projetos: criação transacional, listagem paginada, edição e exclusão.
    ProjectsModule,
    ActivitiesModule,
    IndicatorsModule,
    LocationsModule,
    ObservationsModule,
    // AuthModule depois do UsersModule: importa UsersModule para o login
    // reutilizar o findByEmail (bcrypt.compare) e registra o JwtModule.
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
