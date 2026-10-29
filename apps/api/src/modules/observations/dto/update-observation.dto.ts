import { PartialType } from '@nestjs/mapped-types';
import { CreateObservationDto } from './create-observation.dto.js';

export class UpdateObservationDto extends PartialType(CreateObservationDto) {}
