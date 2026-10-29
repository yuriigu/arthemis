import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateActivityDto } from './create-activity.dto.js';

export class UpdateActivityDto extends PartialType(
  OmitType(CreateActivityDto, ['projectId'] as const),
) {}
