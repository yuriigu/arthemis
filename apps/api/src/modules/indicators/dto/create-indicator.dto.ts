import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateIndicatorDto {
  @IsUUID()
  @IsNotEmpty()
  activityId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  valueBaseline?: number;

  @IsOptional()
  @IsNumber()
  valueReference?: number;

  @IsOptional()
  @IsString()
  observationMethod?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
