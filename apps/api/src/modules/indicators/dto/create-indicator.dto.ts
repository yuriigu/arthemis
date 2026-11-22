import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Direction, IndicatorComponent } from '@arthemis/database';

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

  @IsEnum(IndicatorComponent)
  @IsNotEmpty()
  component: IndicatorComponent;

  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  valueBaseline?: number;

  @IsOptional()
  @IsNumber()
  valueReference?: number;

  @ValidateIf(
    (dto: CreateIndicatorDto) =>
      dto.direction === Direction.decreases_with_condition ||
      (dto.threshold !== undefined && dto.threshold !== null),
  )
  @IsNotEmpty({
    message: 'threshold is required when direction is decreases_with_condition',
  })
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsString()
  referenceSource?: string;

  @IsOptional()
  @IsString()
  observationMethod?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
