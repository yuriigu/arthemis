import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Direction, IndicatorComponent } from '@arthemis/database';
import { CreateIndicatorDto } from './create-indicator.dto';

export class UpdateIndicatorDto extends PartialType(CreateIndicatorDto) {
  @IsOptional()
  @IsEnum(IndicatorComponent)
  component?: IndicatorComponent;

  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @ValidateIf(
    (_dto: UpdateIndicatorDto, value: unknown) =>
      value !== undefined && value !== null,
  )
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsString()
  referenceSource?: string;
}
