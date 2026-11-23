import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@arthemis/database';

export class TransitionProjectDto {
  @IsEnum(ProjectStatus)
  to: ProjectStatus;
}
