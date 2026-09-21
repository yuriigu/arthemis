// Configuração do Prisma CLI (padrão a partir do Prisma 7).
//
// O CLI não carrega mais o .env automaticamente, por isso o dotenv é importado
// aqui. A connection string vive apenas neste arquivo: o `schema.prisma`
// declara somente o provider do datasource.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
