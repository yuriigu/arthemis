import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  IsCivilDate,
} from '../utils/date.util.js';
import { ProjectProponentInputDto } from './create-project.dto.js';

/**
 * DTO para atualização parcial de projetos (PATCH /projects/:id).
 *
 * Todos os campos são opcionais. Os relacionamentos ou campos não enviados
 * devem ser preservados pelo serviço.
 */
export class UpdateProjectDto {
  /**
   * Nome atualizado do projeto.
   */
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
  @IsOptional()
  @IsCivilDate({
    message:
      'lifetimeStart deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-01-01)',
  })
  lifetimeStart?: string;

  /**
   * Data civil de término de vigência no formato YYYY-MM-DD.
   */
  @IsOptional()
  @IsCivilDate({
    message:
      'lifetimeEnd deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-12-31)',
  })
  lifetimeEnd?: string;

  /**
   * Justificativa ou descrição textual do projeto.
   */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'justification deve ser uma string' })
  justification?: string;

  /**
   * Novo identificador do proponente principal.
   */
  @IsOptional()
  @IsUUID('all', { message: 'proponentId deve ser um UUID válido' })
  proponentId?: string;

  /**
   * Lista atualizada de proponentes associados (secundários).
   * Se omitido, os proponentes existentes são preservados.
   */
  @IsOptional()
  @IsArray({ message: 'proponents deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ProjectProponentInputDto)
  proponents?: ProjectProponentInputDto[];

  /**
   * Array numérico atualizado de ODS.
   * Se omitido, os ODS existentes são preservados.
   */
  @IsOptional()
  @IsArray({ message: 'sdgIds deve ser um array numérico' })
  @ArrayNotEmpty({ message: 'sdgIds não pode ser um array vazio quando informado' })
  @IsInt({ each: true, message: 'cada sdgId deve ser um número inteiro' })
  @Min(1, { each: true, message: 'cada sdgId deve ser no mínimo 1' })
  @Max(17, { each: true, message: 'cada sdgId deve ser no máximo 17' })
  sdgIds?: number[];
}
