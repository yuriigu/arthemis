import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Query string do `GET /organizations` — usada pelos seletores/dropdowns da UI.
 *
 * `page` e `limit` controlam a paginação, e `search` filtra por nome,
 * case-insensitive. Declarar o DTO mantém o contrato estrito: com o
 * `ValidationPipe` global (`whitelist`/`forbidNonWhitelisted`), qualquer outro
 * parâmetro responde 400 em vez de ser silenciosamente ignorado.
 */
export class ListOrganizationsQueryDto {
  /** Página solicitada (mínimo: 1, padrão: 1). */
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  /** Itens por página (mínimo: 1, máximo: 100, padrão: 10). */
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit?: number = 10;

  /** Trecho opcional do nome a filtrar. */
  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @MaxLength(150, { message: 'search must be at most 150 characters long' })
  search?: string;
}
