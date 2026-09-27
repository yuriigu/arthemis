import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Corpo do `POST /users` — espelha o `CreateUserRequest` do auth legado
 * (`legacy/edge/services/auth/models/i_register.go`), trocando `username` por
 * `email` como identidade.
 *
 * `role` **não** faz parte do contrato: no legado o próprio cliente escolhia o
 * papel (inclusive `admin`), o que permitia escalação de privilégio. Aqui o
 * papel é definido no servidor (`DEFAULT_USER_ROLE`) e só poderá ser alterado
 * por um fluxo autenticado de administração em task futura.
 */
export class CreateUserDto {
  /** Normalizado (trim + lowercase) antes de validar e de ir para o banco. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid e-mail address' })
  @MaxLength(150, { message: 'email must be at most 150 characters long' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(72, { message: 'password must be at most 72 characters long' })
  password!: string;
}
