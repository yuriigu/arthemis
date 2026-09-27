import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';

const TEST_SECRET = 'strategy-test-jwt-secret-0123456789-abcde';

describe('JwtStrategy', () => {
  const payload = {
    sub: '9c1c2f1e-6a4c-4d0e-9f3a-1b2c3d4e5f60',
    email: 'user@arthemis.test',
    role: 'visitor',
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    // ConfigService standalone: o segredo vem do mesmo getOrThrow('JWT_SECRET')
    // usado em produção (ConfigModule).
    strategy = new JwtStrategy(new ConfigService({ JWT_SECRET: TEST_SECRET }));
  });

  it('lê o segredo via getOrThrow(JWT_SECRET) — sem segredo o boot falha', () => {
    expect(() => new JwtStrategy(new ConfigService({}))).toThrow();
  });

  it('devolve sub/email/role a partir do payload validado', () => {
    expect(strategy.validate(payload)).toEqual(payload);
  });

  it('rejeita token sem payload (null)', () => {
    expect(() => strategy.validate(null)).toThrow(UnauthorizedException);
  });

  it('rejeita payload sem sub (igual ao /validate legado)', () => {
    expect(() => strategy.validate({ ...payload, sub: '' })).toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita payload sem role (igual ao /validate legado)', () => {
    expect(() =>
      strategy.validate({ ...payload, role: '' } as unknown as typeof payload),
    ).toThrow(UnauthorizedException);
  });
});
