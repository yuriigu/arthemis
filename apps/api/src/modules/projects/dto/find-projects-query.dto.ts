import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Parâmetros de consulta (query string) aceitos na rota de listagem de projetos (GET /projects).
 *
 * Suporta paginação no banco de dados e busca textual com valores padrão e limites seguros:
 * - `page`: página atual (padrão: 1, mínimo: 1);
 * - `limit`: itens por página (padrão: 10, mínimo: 1, máximo: 100);
 * - `search`: termo opcional de busca textual em nome, justificativa e nome do proponente principal.
 */
export class FindProjectsQueryDto {
  /**
   * Número da página a ser consultada (mínimo: 1, padrão: 1).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser no mínimo 1' })
  page?: number = 1;

  /**
   * Quantidade de registros por página (mínimo: 1, máximo: 100, padrão: 10).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1, { message: 'limit deve ser no mínimo 1' })
  @Max(100, { message: 'limit deve ser no máximo 100' })
  limit?: number = 10;

  /**
   * Termo opcional de pesquisa textual (filtra por nome do projeto, justificativa e proponente).
   */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'search deve ser uma string' })
  @MaxLength(150, { message: 'search deve ter no máximo 150 caracteres' })
  search?: string;
}
