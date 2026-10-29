import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  IsAfterOrEqualDateField,
  IsCivilDate,
} from '../../projects/utils/date.util.js';

export class CreateActivityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'projectId deve ser um UUID válido' })
  projectId!: string;

  @ApiProperty({ example: 'Community engagement', maxLength: 100 })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'name deve ser uma string' })
  @IsNotEmpty({ message: 'name é obrigatório' })
  @MaxLength(100, { message: 'name deve ter no máximo 100 caracteres' })
  name!: string;

  @ApiProperty({ example: '2026-01-01', format: 'date' })
  @IsCivilDate({ message: 'startDate deve ser uma data civil válida' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-31', format: 'date' })
  @IsCivilDate({ message: 'endDate deve ser uma data civil válida' })
  @IsAfterOrEqualDateField('startDate', {
    message: 'endDate não pode ser anterior a startDate',
  })
  endDate!: string;

  @ApiPropertyOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'description deve ser uma string' })
  description?: string;

  @ApiPropertyOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsString({ message: 'justification deve ser uma string' })
  justification?: string;

  @IsOptional()
  @IsArray({ message: 'locationIds deve ser um array' })
  @ArrayUnique({ message: 'locationIds não pode conter duplicados' })
  @IsUUID('all', {
    each: true,
    message: 'cada locationId deve ser um UUID válido',
  })
  locationIds?: string[];
}
