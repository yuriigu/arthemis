import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Query string do `GET /proponents` — usada pelos seletores/dropdowns da UI.
 *
 * Só o `search` é aceito (busca por nome, case-insensitive). Declarar o DTO (em
 * vez de ler o `@Query('search')` cru) mantém o contrato estrito: com o
 * `ValidationPipe` global (`whitelist`/`forbidNonWhitelisted`), qualquer outro
 * parâmetro responde 400 em vez de ser silenciosamente ignorado.
 */
export class ListProponentsQueryDto {
  /** Trecho do nome a filtrar. Vazio/ausente devolve a lista completa. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @MaxLength(150, { message: 'search must be at most 150 characters long' })
  search?: string;
}
