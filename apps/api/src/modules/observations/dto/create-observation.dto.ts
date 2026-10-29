import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { IsCivilDate } from '../../projects/utils/date.util.js';
import type { ObservationPosition } from '../models/i-observation.js';

export class CreateObservationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'indicatorId deve ser um UUID válido' })
  indicatorId!: string;

  @ApiProperty({ type: Number, example: 15.2 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  value!: number;

  @ApiProperty({ example: '2026-03-15', format: 'date' })
  @IsCivilDate({
    message: 'date deve ser uma data civil válida no formato YYYY-MM-DD',
  })
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject({ message: 'position deve ser um objeto JSON' })
  position?: ObservationPosition;
}
