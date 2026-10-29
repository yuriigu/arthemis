import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma/client.js';
import { IsCivilDate } from '../utils/date.util.js';
import { ProjectOrganizationInputDto } from './create-project.dto.js';

/**
 * DTO para atualização parcial de projetos (PATCH /projects/:id).
 *
 * Todos os campos são opcionais. Os relacionamentos ou campos não enviados
 * devem ser preservados pelo serviço.
 */
export class UpdateProjectDto {
  /**
   * Status do ciclo de vida SD-VISta.
   */
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus, {
    message: 'status deve ser Draft, Listed, Under_Assessment ou Verified',
  })
  status?: ProjectStatus;

  /**
   * Nome atualizado do projeto.
   */
  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'name deve ser uma string' })
  @MaxLength(150, { message: 'name deve ter no máximo 150 caracteres' })
  name?: string;

  /**
   * Data civil de início de vigência no formato YYYY-MM-DD.
   */
  @ApiPropertyOptional({ example: '2026-01-01', format: 'date' })
  @IsOptional()
  @IsCivilDate({
    message:
      'lifetimeStart deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-01-01)',
  })
  lifetimeStart?: string;

  /**
   * Data civil de término de vigência no formato YYYY-MM-DD.
   */
  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
  @IsOptional()
  @IsCivilDate({
    message:
      'lifetimeEnd deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-12-31)',
  })
  lifetimeEnd?: string;

  /**
   * Justificativa ou descrição textual do projeto.
   */
  @ApiPropertyOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'justification deve ser uma string' })
  justification?: string;

  /**
   * Novo identificador da organização principal.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'organizationId deve ser um UUID válido' })
  organizationId?: string;

  /**
   * Lista atualizada de organizações associadas (secundários).
   * Se omitido, os organizações existentes são preservados.
   */
  @ApiPropertyOptional({ type: [ProjectOrganizationInputDto] })
  @IsOptional()
  @IsArray({ message: 'organizations deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ProjectOrganizationInputDto)
  organizations?: ProjectOrganizationInputDto[];

  /**
   * Array numérico atualizado de ODS.
   * Se omitido, os ODS existentes são preservados.
   */
  @ApiPropertyOptional({ type: [Number], example: [1, 13] })
  @IsOptional()
  @IsArray({ message: 'sdgIds deve ser um array numérico' })
  @ArrayNotEmpty({
    message: 'sdgIds não pode ser um array vazio quando informado',
  })
  @IsInt({ each: true, message: 'cada sdgId deve ser um número inteiro' })
  @Min(1, { each: true, message: 'cada sdgId deve ser no mínimo 1' })
  @Max(17, { each: true, message: 'cada sdgId deve ser no máximo 17' })
  sdgIds?: number[];
}
