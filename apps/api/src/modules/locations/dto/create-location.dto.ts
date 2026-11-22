import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Prisma } from '@arthemis/database';
import {
  IUCN_ECOSYSTEM_CODES,
  IucnEcosystemCode,
} from '../constants/iucn-ecosystem-codes';

export class CreateLocationDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsString()
  ecosystem?: string;

  @IsOptional()
  @IsString()
  @IsIn(IUCN_ECOSYSTEM_CODES)
  ecosystemCode?: IucnEcosystemCode;

  @IsOptional()
  @IsNumber()
  extent?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsObject() // JSONB no banco
  position?: Prisma.InputJsonValue;
}
