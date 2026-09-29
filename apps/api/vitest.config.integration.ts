import { defineConfig } from 'vitest/config';

/**
 * Testes de integração: usam o PostgreSQL real do `docker compose`.
 *
 * Rode `docker compose up -d` antes. A aplicação é inicializada com o
 * AppModule completo, então o fail-fast do PrismaService falha o teste caso o
 * banco esteja fora — o mesmo comportamento de produção.
 */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.integration-spec.ts'],
    // Os testes compartilham a mesma tabela `users`: evitar paralelismo.
    fileParallelism: false,
  },
});
