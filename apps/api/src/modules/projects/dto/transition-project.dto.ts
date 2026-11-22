import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class TransitionProjectDto {
  @IsEnum(ProjectStatus)
  to: ProjectStatus;
}