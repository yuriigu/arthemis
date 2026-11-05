import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { LocationsModule } from './modules/locations/locations.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { SdgsModule } from './modules/sdgs/sdgs.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { environmentValidationSchema } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validationSchema: environmentValidationSchema,
    }),
    PrismaModule, // Para o banco de dados
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ProjectsModule,
    ActivitiesModule,
    LocationsModule,
    IndicatorsModule,
    ObservationsModule,
    SdgsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
