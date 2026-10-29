import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { LocationPosition } from '../models/i-location.js';

export class CreateLocationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'projectId deve ser um UUID válido' })
  projectId!: string;

  @ApiProperty({ example: 'Reserva do Rio Xingu', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Tropical forest', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ecosystem!: string;

  @ApiProperty({ type: Number, example: 125.5 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  extent!: number;

  @ApiProperty({ example: 'Brazil', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject({ message: 'position deve ser um objeto JSON' })
  position?: LocationPosition;
}
