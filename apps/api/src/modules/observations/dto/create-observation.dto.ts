import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Prisma } from '@arthemis/database';

export class CreateObservationDto {
  @IsUUID()
  periodId: string;
  @IsNotEmpty()
  indicatorId: string;

  @IsNumber()
  value: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsObject()
  position?: Prisma.InputJsonValue;
}
