import { BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

/**
 * Custo do bcrypt: 10 — mesmo `bcrypt.DefaultCost` usado no
 * `legacy/edge/services/auth/handlers/register.go` (`bcrypt.GenerateFromPassword`).
 */
export const BCRYPT_SALT_ROUNDS = 10;

/**
 * O bcrypt processa apenas os primeiros 72 bytes da senha. Entradas maiores são
 * rejeitadas para evitar truncamento silencioso (duas senhas diferentes com os
 * mesmos 72 bytes iniciais autenticariam uma pela outra).
 */
export const BCRYPT_MAX_PASSWORD_BYTES = 72;

/**
 * Gera o hash da senha com salt próprio (10 rounds).
 *
 * A senha em texto limpo nunca é persistida, logada ou devolvida por esta API:
 * o valor de retorno é o único dado que pode seguir para o banco.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  assertFitsBcryptLimit(plainPassword);

  return hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Compara uma senha em texto limpo com o hash armazenado (usada no login, que
 * chega em outra task). Equivale ao `bcrypt.CompareHashAndPassword` do legado,
 * mas devolve `false` em vez de erro para hash malformado.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await compare(plainPassword, passwordHash);
  } catch {
    return false;
  }
}

function assertFitsBcryptLimit(plainPassword: string): void {
  if (Buffer.byteLength(plainPassword, 'utf8') > BCRYPT_MAX_PASSWORD_BYTES) {
    throw new BadRequestException(
      `password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes long`,
    );
  }
}
