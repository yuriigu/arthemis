import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { IsAfterOrEqualDateField, IsCivilDate } from '../utils/date.util.js';

/**
 * Item de organização secundário/associado enviado no corpo da requisição.
 */
export class ProjectOrganizationInputDto {
  /**
   * Identificador UUID da organização associada.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', {
    message: 'organizationId da organização associada deve ser um UUID válido',
  })
  @IsNotEmpty({
    message: 'organizationId da organização associada é obrigatório',
  })
  organizationId!: string;

  /**
   * Papel da organização associada no projeto (ex.: Co-executor, Parceiro, Patrocinador).
   */
  @ApiPropertyOptional({ maxLength: 50 })
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
 * - Organização principal e organizações secundárias;
 * - Array numérico de identificadores de ODS (1..17).
 */
export class CreateProjectDto {
  /**
   * Nome do projeto socioambiental (até 150 caracteres).
   */
  @ApiProperty({ example: 'Community forest restoration', maxLength: 150 })
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
  @ApiProperty({ example: '2026-01-01', format: 'date' })
  @IsCivilDate({
    message:
      'lifetimeStart deve ser uma data civil válida no formato YYYY-MM-DD (ex.: 2026-01-01)',
  })
  @IsNotEmpty({ message: 'lifetimeStart é obrigatório' })
  lifetimeStart!: string;

  /**
   * Data civil de término de vigência no formato YYYY-MM-DD, maior ou igual a lifetimeStart.
   */
  @ApiProperty({ example: '2026-12-31', format: 'date' })
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
  @ApiPropertyOptional({ example: 'Project justification' })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'justification deve ser uma string' })
  justification?: string;

  /**
   * Identificador UUID da organização principal.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'organizationId deve ser um UUID válido' })
  @IsNotEmpty({ message: 'organizationId é obrigatório' })
  organizationId!: string;

  /**
   * Lista opcional de organizações associadas (secundárias) com seus respectivos papéis.
   */
  @ApiPropertyOptional({ type: [ProjectOrganizationInputDto] })
  @IsOptional()
  @IsArray({ message: 'organizations deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ProjectOrganizationInputDto)
  organizations?: ProjectOrganizationInputDto[];

  /**
   * Array numérico contendo pelo menos um identificador de ODS (números oficiais 1 a 17).
   */
  @ApiProperty({ type: [Number], example: [1, 13] })
  @IsArray({ message: 'sdgIds deve ser um array numérico' })
  @ArrayNotEmpty({
    message: 'sdgIds deve conter pelo menos um identificador de ODS',
  })
  @IsInt({ each: true, message: 'cada sdgId deve ser um número inteiro' })
  @Min(1, { each: true, message: 'cada sdgId deve ser no mínimo 1' })
  @Max(17, { each: true, message: 'cada sdgId deve ser no máximo 17' })
  sdgIds!: number[];
}
