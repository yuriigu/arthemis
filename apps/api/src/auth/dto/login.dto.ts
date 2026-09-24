import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Corpo do `POST /auth/login` — espelha o `LoginRequest` do auth legado
 * (`legacy/edge/services/auth/models/i_login.go`), trocando `username` por
 * `email` como identidade (mesmo contrato do `CreateUserDto`).
 *
 * Sem `MinLength` de força aqui de propósito: a regra de força da senha vale no
 * cadastro (`CreateUserDto`), enquanto o login entrega qualquer senha ao
 * `bcrypt.compare` e responde 401 uniforme — sem vazar se o e-mail existe
 * (anti-enumeração, igual ao `authenticateUser` do legado).
 */
export class LoginDto {
  /** Normalizado (trim + lowercase) antes de validar — mesmos passos do repositório. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid e-mail address' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(150, { message: 'email must be at most 150 characters long' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  password!: string;
}
