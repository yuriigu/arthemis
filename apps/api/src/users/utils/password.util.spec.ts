import { BadRequestException } from '@nestjs/common';
import {
  BCRYPT_MAX_PASSWORD_BYTES,
  BCRYPT_SALT_ROUNDS,
  hashPassword,
  verifyPassword,
} from './password.util.js';

describe('password util', () => {
  const password = 'senha-secreta-123';

  it('gera hash bcrypt com custo 10 e salt próprio', async () => {
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toBe(password);
    expect(first.startsWith(`$2b$${BCRYPT_SALT_ROUNDS}$`)).toBe(true);
    // Salt aleatório por chamada: o mesmo texto limpo gera hashes diferentes.
    expect(second).not.toBe(first);
  });

  it('verifica a senha correta e rejeita a incorreta', async () => {
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('senha-errada-123', hash)).resolves.toBe(false);
  });

  it('não autentica quando o hash armazenado é inválido', async () => {
    await expect(verifyPassword(password, 'nao-e-um-hash')).resolves.toBe(
      false,
    );
  });

  it('recusa senha acima do limite de 72 bytes do bcrypt', async () => {
    const tooLong = 'a'.repeat(BCRYPT_MAX_PASSWORD_BYTES + 1);

    await expect(hashPassword(tooLong)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
