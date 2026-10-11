import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  IsAfterOrEqualDateField,
  IsCivilDate,
} from '../utils/date.util.js';

/**
 * Item de proponente secundário/associado enviado no corpo da requisição.
 */
export class ProjectProponentInputDto {
  /**
   * Identificador UUID do proponente associado.
   */
  @IsUUID('all', { message: 'proponentId do proponente associado deve ser um UUID válido' })
  @IsNotEmpty({ message: 'proponentId do proponente associado é obrigatório' })
  proponentId!: string;

  /**
   * Papel do proponente associado no projeto (ex.: Co-executor, Parceiro, Patrocinador).
   */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'role deve ser uma string' })
  @MaxLength(50, { message: 'role deve ter no máximo 50 caracteres' })
  role?: string;
}

/**
 * DTO para criação de novos projetos (POST /projects).
 *
 * Valida todos os campos obrigatórios conforme o schema do Prisma e regras de negócio:
 * - Datas de vigência civis estritas (YYYY-MM-DD);
 * - Proponente principal e secundários;
 * - Array numérico de identificadores de ODS (1..17).
 */
export class CreateProjectDto {
  /**
   * Nome do projeto socioambiental (até 150 caracteres).
   */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'name deve ser uma string' })
  @IsNotEmpty({ message: 'name é obrigatório' })
  @MaxLength(150, { message: 'name deve ter no máximo 150 caracteres' })
  name!: string;

  /**
   * Data civil de início de vigência no formato YYYY-MM-DD.
   */
  @IsCivilDate({
    message:
      'lifetimeStart deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-01-01)',
  })
  @IsNotEmpty({ message: 'lifetimeStart é obrigatório' })
  lifetimeStart!: string;

  /**
   * Data civil de término de vigência no formato YYYY-MM-DD, maior ou igual a lifetimeStart.
   */
  @IsCivilDate({
    message:
      'lifetimeEnd deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-12-31)',
  })
  @IsNotEmpty({ message: 'lifetimeEnd é obrigatório' })
  @IsAfterOrEqualDateField('lifetimeStart', {
    message: 'lifetimeEnd deve ser maior ou igual a lifetimeStart',
  })
  lifetimeEnd!: string;

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
   * Identificador UUID do proponente principal da organização.
   */
  @IsUUID('all', { message: 'proponentId deve ser um UUID válido' })
  @IsNotEmpty({ message: 'proponentId é obrigatório' })
  proponentId!: string;

  /**
   * Lista opcional de proponentes associados (secundários) com seus respectivos papéis.
   */
  @IsOptional()
  @IsArray({ message: 'proponents deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ProjectProponentInputDto)
  proponents?: ProjectProponentInputDto[];

  /**
   * Array numérico contendo pelo menos um identificador de ODS (números oficiais 1 a 17).
   */
  @IsArray({ message: 'sdgIds deve ser um array numérico' })
  @ArrayNotEmpty({ message: 'sdgIds deve conter pelo menos um identificador de ODS' })
  @IsInt({ each: true, message: 'cada sdgId deve ser um número inteiro' })
  @Min(1, { each: true, message: 'cada sdgId deve ser no mínimo 1' })
  @Max(17, { each: true, message: 'cada sdgId deve ser no máximo 17' })
  sdgIds!: number[];
}
