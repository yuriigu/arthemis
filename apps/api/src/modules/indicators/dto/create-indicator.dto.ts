import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateIndicatorDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  activityId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  locationId!: string;

  @ApiProperty({ example: 'Forest cover', maxLength: 100 })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({ type: Number, example: 10 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  valueBaseline!: number;

  @ApiProperty({ type: Number, example: 20 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  valueReference!: number;

  @ApiPropertyOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  observationMethod?: string;

  @ApiPropertyOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  justification?: string;
}
