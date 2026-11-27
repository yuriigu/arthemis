import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Prisma } from '@arthemis/database';

export class CreateObservationDto {
  @IsUUID()
  periodId: string;

  @IsOptional()
  @IsUUID()
  indicatorId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsObject()
  position?: Prisma.InputJsonValue;
}
