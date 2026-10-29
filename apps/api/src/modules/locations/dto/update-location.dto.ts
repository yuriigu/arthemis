import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto.js';

export class UpdateLocationDto extends PartialType(
  OmitType(CreateLocationDto, ['projectId'] as const),
) {}
