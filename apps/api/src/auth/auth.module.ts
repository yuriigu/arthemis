import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

/**
 * Módulo de autenticação: login JWT e rota protegida `/auth/me`.
 *
 * - `PassportModule.register` registra o token `AuthModuleOptions` exigido
 *   pelo `AuthGuard()` do @nestjs/passport v12 (injetado no `JwtAuthGuard`);
 *   usar o `PassportModule` "puro" não basta — ele não provê esse token.
 * - `JwtModule.registerAsync` lê `JWT_SECRET` e `JWT_EXPIRES_IN` via
 *   ConfigService (fail-fast: o boot aborta se o segredo faltar, mesmo
 *   comportamento do `GetEnv("JWT_TOKEN")` do auth legado);
 * - `JwtStrategy` registra a estratégia `jwt` consumida pelo `JwtAuthGuard`;
 * - `UsersModule` é importado para o `AuthService` reutilizar o
 *   `findByEmail` (o login legado fazia `WHERE username = ?` +
 *   `bcrypt.CompareHashAndPassword`).
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // `JwtSignOptions['expiresIn']`: o @nestjs/jwt usa o `StringValue`
          // (template literal) do `ms`, não `string` simples.
          expiresIn: configService.get<JwtSignOptions['expiresIn']>(
            'JWT_EXPIRES_IN',
            '24h',
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
