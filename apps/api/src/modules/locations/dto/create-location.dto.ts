import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Prisma } from '@arthemis/database';
import {
  IUCN_ECOSYSTEM_CODES,
  IucnEcosystemCode,
} from '../constants/iucn-ecosystem-codes';
import { IsGeoJSON } from '../../../common/decorators/is-geojson.decorator';
import { IucnEcosystemCode as IucnEcosystemCodeDecorator } from '../../../common/decorators/iucn-ecosystem-code.decorator';

export class CreateLocationDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsString()
  ecosystem?: string;

  @IsOptional()
  @IucnEcosystemCodeDecorator()
  ecosystemCode?: string;

  @IsOptional()
  @IsNumber()
  extent?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsGeoJSON()
  position?: Prisma.InputJsonValue;
}
