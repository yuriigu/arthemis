# Arthemis API

Backend do Arthemis em Nest.js. Esta é a base criada na **Task #1** (setup da API
e infraestrutura de banco), que substitui gradualmente os serviços legados em Go
(`legacy/brain`, `legacy/edge`, `legacy/watcher`).

O que já existe:

- Esqueleto Nest.js rodando na porta **8081** (compatível com o gateway Traefik legado).
- Validação de variáveis de ambiente no boot (fail-fast).
- Prisma ORM configurado (sem models ainda) com driver adapter `pg`.
- `docker-compose.yml` apenas com o PostgreSQL 16.
- `GET /healthcheck` com ping real no banco (200/503).

## Stack

| Camada    | Tecnologia                                       |
| --------- | ------------------------------------------------ |
| Runtime   | Node.js 22+                                      |
| Framework | Nest.js 12 (TypeScript, ESM)                     |
| ORM       | Prisma 7 (`prisma-client` + `@prisma/adapter-pg`) |
| Banco     | PostgreSQL 16 (Docker Compose)                   |
| Testes    | Vitest + Supertest                               |
| Lint      | oxlint + Prettier                                |

## Estrutura

```text
apps/api
├── prisma/schema.prisma          # generator + datasource (models virão nas próximas tasks)
├── prisma.config.ts              # config do Prisma CLI: schema + DATABASE_URL
├── docker-compose.yml            # somente o PostgreSQL 16
├── .env.example                  # modelo das variáveis de ambiente
└── src
    ├── config/env.validation.ts  # schema zod validado no boot
    ├── health/                   # GET /healthcheck (controller/service + contrato legado)
    ├── prisma/                   # PrismaModule/PrismaService (global)
    ├── app.module.ts
    └── main.ts                   # bootstrap (porta 8081, fail-fast)
```

## Pré-requisitos

- Node.js 22 ou superior e npm
- Docker com Docker Compose

## Configuração

```bash
cd apps/api
cp .env.example .env       # ajuste as credenciais se necessário
npm install
npm run prisma:generate    # gera o client em src/generated/prisma (não versionado)
docker compose up -d       # sobe o PostgreSQL 16 na porta 5432
npm run start:dev          # sobe a API em http://localhost:8081
```

> O client do Prisma é gerado a partir do `schema.prisma` e **não** é versionado:
> rode `npm run prisma:generate` após clonar o repositório ou alterar o schema.

## Variáveis de ambiente

| Variável            | Obrigatória   | Default        | Descrição                              |
| ------------------- | ------------- | -------------- | -------------------------------------- |
| `PORT`              | não           | `8081`         | Porta HTTP da API.                     |
| `SERVICE_NAME`      | não           | `arthemis-api` | Valor do campo `service` no healthcheck. |
| `NODE_ENV`          | não           | `development`  | `development`, `test` ou `production`. |
| `DATABASE_URL`      | **sim**       | —              | Connection string usada pelo Prisma.   |
| `POSTGRES_USER`     | sim (Compose) | —              | Usuário criado no container.           |
| `POSTGRES_PASSWORD` | sim (Compose) | —              | Senha do usuário.                      |
| `POSTGRES_DB`       | sim (Compose) | —              | Nome do banco.                         |

A validação (`src/config/env.validation.ts`) roda no boot: sem `DATABASE_URL` a
aplicação encerra com erro em vez de subir sem banco — comportamento herdado do
serviço `auth` legado. As variáveis `POSTGRES_*` são exigidas pelo
`docker-compose.yml` (o Compose falha explicitamente se faltarem) e devem bater
com a `DATABASE_URL`.

## Endpoints

### `GET /`

Smoke test: responde `Hello World!`.

### `GET /healthcheck`

Ping real no banco (`prisma.$queryRaw` + `SELECT 1`) com timeout de 2 segundos.

Saudável — `200`:

```json
{
  "status": "ok",
  "service": "arthemis-api",
  "timestamp": "2026-09-20T20:48:38.000Z",
  "checks": {
    "database": { "status": "up", "message": "database connection is healthy" }
  }
}
```

Banco fora — `503` (resposta elegante, sem estourar um 500 genérico):

```json
{
  "status": "degraded",
  "service": "arthemis-api",
  "timestamp": "2026-09-20T20:48:38.000Z",
  "checks": {
    "database": {
      "status": "down",
      "message": "database is unreachable at 127.0.0.1:5432"
    }
  }
}
```

O formato segue o contrato do `legacy/edge/services/auth/handlers/health.go`. O
`/health` do `brain` legado (que sempre respondia 200) não foi reaproveitado.

## Scripts

| Script                    | Descrição                                            |
| ------------------------- | ---------------------------------------------------- |
| `npm run start:dev`       | Sobe a API em modo watch.                            |
| `npm run start:prod`      | Executa o build (`dist/`).                           |
| `npm run build`           | Compila o projeto.                                   |
| `npm test`                | Testes unitários (Vitest).                           |
| `npm run test:e2e`        | Testes de contrato HTTP (sem banco).                 |
| `npm run lint`            | oxlint.                                              |
| `npm run format`          | Prettier.                                            |
| `npm run prisma:generate` | Gera o Prisma Client em `src/generated/prisma`.      |
| `npm run db:migrate`      | Cria/aplica migrations em desenvolvimento.           |
| `npm run db:push`         | Sincroniza o schema com o banco sem gerar migration. |

## Banco de dados

```bash
docker compose up -d            # sobe o container
docker compose ps               # status + healthcheck
docker compose logs -f postgres # logs
docker compose down             # derruba (mantém o volume)
docker compose down -v          # derruba e apaga o volume
```

Não há rede externa `arthemis-edge` nem serviço de aplicação no Compose: a
integração com o Traefik/gateway fica para a task de deploy.
