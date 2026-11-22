import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  IUCN_ECOSYSTEM_CODES,
  IucnEcosystemCode,
} from '../constants/iucn-ecosystem-codes';
import { CreateLocationDto } from './create-location.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @IsOptional()
  @IsString()
  @IsIn(IUCN_ECOSYSTEM_CODES)
  ecosystemCode?: IucnEcosystemCode;
}
