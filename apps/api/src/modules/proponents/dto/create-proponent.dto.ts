import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Corpo do `POST /proponents`.
 *
 * Espelha o `models.Proponent` do legado (`legacy/brain/internal/models/
 * proponent.go`), que só tinha `Name` e `Email`:
 * - `name`: obrigatório, normalizado com `trim` (o legado gravava como veio);
 * - `email`: obrigatório e válido; normalizado com `trim + lowercase` antes de
 *   validar e de ir para o banco, os mesmos passos do `CreateUserDto`/repositório
 *   de usuários (evita duplicidade apenas por caixa/espaços).
 *
 * O `MaxLength` é uma trava **desta API** (o banco usa `text` por paridade com o
 * gorm), alinhado ao varchar(150) dos demais campos de nome do domínio
 * (`projects.name`).
 */
export class CreateProponentDto {
  /** Normalizado (trim) antes de validar e de ir para o banco. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(150, { message: 'name must be at most 150 characters long' })
  name!: string;

  /** Normalizado (trim + lowercase) antes de validar e de ir para o banco. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid e-mail address' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(150, { message: 'email must be at most 150 characters long' })
  email!: string;
}
