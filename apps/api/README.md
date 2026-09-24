# Arthemis API

Backend do Arthemis em Nest.js. Esta é a base criada na **Task #1** (setup da API
e infraestrutura de banco), que substitui gradualmente os serviços legados em Go
(`legacy/brain`, `legacy/edge`, `legacy/watcher`).

O que já existe:

- Esqueleto Nest.js rodando na porta **8081** (compatível com o gateway Traefik legado).
- Validação de variáveis de ambiente no boot (fail-fast).
- Prisma ORM configurado com driver adapter `pg` (model `User` + migration aplicada).
- `docker-compose.yml` apenas com o PostgreSQL 16.
- `GET /healthcheck` com ping real no banco (200/503).
- Módulo de usuários (`POST /users`, `GET /users/:id`) com hash bcrypt e seed inicial.
- Módulo de autenticação (`POST /auth/login`, `GET /auth/me`) com JWT (HS256) e guard.

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
├── prisma/schema.prisma          # model User (tabela `users`) + generator/datasource
├── prisma/migrations/            # migration create_users_table (aplicada)
├── prisma/seed.ts                # seed de desenvolvimento (usuário inicial)
├── prisma.config.ts              # config do Prisma CLI: schema, migrations, seed e DATABASE_URL
├── docker-compose.yml            # somente o PostgreSQL 16
├── .env.example                  # modelo das variáveis de ambiente
└── src
    ├── config/env.validation.ts  # schema zod validado no boot
    ├── config/app.setup.ts       # ValidationPipe global (compartilhado com os testes)
    ├── health/                   # GET /healthcheck (controller/service + contrato legado)
    ├── prisma/                   # PrismaModule/PrismaService (global)
    ├── users/                    # UsersModule/Controller/Service/Repository + DTOs
    ├── auth/                     # AuthModule/Controller/Service + DTO, guard e estratégia JWT
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
| `JWT_SECRET`        | **sim**       | —              | Segredo de assinatura HS256 do JWT (mínimo 32 caracteres). |
| `JWT_EXPIRES_IN`    | não           | `24h`          | Validade do `access_token` (formato do `ms`: `15m`, `24h`, `7d`). |

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

## Usuários

Model `User` (tabela `users`) e módulo `src/users`, com o mapeamento vindo do
legado: PK em UUID (era a claim `sub` do `auth`), `role` em varchar(20) com
default `visitor` e CHECK no banco (`admin | manager | visitor`), e-mail único
(o `username` do legado foi substituído pelo e-mail como identidade) e o hash de
senha em `password_hash`.

| Método | Rota         | Comportamento                                                                |
| ------ | ------------ | ---------------------------------------------------------------------------- |
| `POST` | `/users`     | `201` com `{ id, email, role, createdAt, updatedAt }`; `400` corpo inválido; `409` e-mail já cadastrado |
| `GET`  | `/users/:id` | `200` com o usuário (sem hash); `400` id que não é UUID; `404` não encontrado |

Regras de segurança implementadas:

- a senha é gravada **somente** como hash bcrypt (salt 10 — mesmo
  `bcrypt.DefaultCost` do `auth` legado) na coluna `password_hash`;
- o `passwordHash` não é exposto em nenhuma resposta: o `select` do repositório
  nem lê a coluna nas buscas públicas (equivalente ao `sanitizeUser` do brain);
- `role` **não** é aceito no corpo — o servidor aplica sempre `visitor`,
  eliminando a escalação de privilégio que existia no `/register` legado (que
  aceitava o `role` enviado pelo cliente);
- senhas acima de 72 bytes são rejeitadas (limite do bcrypt, evita truncamento
  silencioso) e o e-mail é normalizado (trim + lowercase) antes de validar;
- nenhum log registra senha ou e-mail (apenas o `id` do usuário criado).

```bash
# criar usuário
curl -i -X POST http://localhost:8081/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"novo@arthemis.test","password":"senha-forte-123"}'

# buscar por id
curl -i http://localhost:8081/users/<id>

# conferir que a senha está em hash no banco (nunca texto limpo)
docker exec arthemis-api-postgres psql -U arthemis_user -d arthemis_db \
  -c "SELECT email, left(password_hash, 7) AS hash_prefix, role FROM users;"
```

`UsersService.findByEmail` devolve o registro **com** o hash para o
`bcrypt.compare` do `AuthService`, mas **não** é exposto em HTTP para não
permitir enumeração de e-mails.

### Seed de desenvolvimento

```bash
npm run prisma:seed   # cria/atualiza admin@arthemis.local (role admin, senha default de dev: arthemis-dev-123)
```

Variáveis opcionais: `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` e `SEED_USER_ROLE`
(veja o `.env.example`). O seed é idempotente e recusa a senha default quando
`NODE_ENV=production` sem `SEED_USER_PASSWORD` explícito.

## Autenticação

Portabilidade do serviço `auth` legado (`legacy/edge/services/auth`): login com
JWT **HS256**, claims `sub` (UUID do usuário), `email` e `role`, validade de
`JWT_EXPIRES_IN` (default 24h — igual ao `exp` fixo do legado) e verificação do
`Authorization: Bearer` pelo `JwtAuthGuard`/`JwtStrategy`.

| Método | Rota         | Comportamento |
| ------ | ------------ | ------------- |
| `POST` | `/auth/login` | `200` com `{ "access_token": "..." }`; `400` corpo inválido; `401` credenciais inválidas |
| `GET`  | `/auth/me`    | `200` com o perfil do usuário do token (sem hash); `401` sem token, inválido ou expirado |

Regras herdadas do legado:

- senha conferida com `bcrypt.compare` (hash custo 10 — mesmo custo do
  `bcrypt.DefaultCost` do registro legado);
- **resposta 401 uniforme** (`"Credenciais inválidas"`) para e-mail não
  cadastrado e para senha errada: o `authenticateUser` do Go também respondia
  401 indistinto para não revelar qual campo falhou;
- token sem `sub`/`role`, assinado com outra chave, com algoritmo diferente de
  HS256 ou expirado é rejeitado com `401` (como o `/validate` legado);
- o `GET /auth/me` consulta o banco a partir do `sub` do token: papel e e-mail
  sempre atualizados e o `passwordHash` jamais sai da camada de repositório.

```bash
# login
curl -i -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@arthemis.local","password":"arthemis-dev-123"}'

# rota protegida (troque <token> pelo access_token retornado acima)
curl -i http://localhost:8081/auth/me -H 'Authorization: Bearer <token>'
```

## Scripts

| Script                    | Descrição                                            |
| ------------------------- | ---------------------------------------------------- |
| `npm run start:dev`       | Sobe a API em modo watch.                            |
| `npm run start:prod`      | Executa o build (`dist/`).                           |
| `npm run build`           | Compila o projeto.                                   |
| `npm test`                | Testes unitários (Vitest).                           |
| `npm run test:e2e`        | Testes de contrato HTTP (sem banco).                 |
| `npm run test:integration`| Testes com o PostgreSQL real (requer `docker compose up -d`). |
| `npm run lint`            | oxlint.                                              |
| `npm run format`          | Prettier.                                            |
| `npm run prisma:generate` | Gera o Prisma Client em `src/generated/prisma`.      |
| `npm run prisma:seed`     | Cria/atualiza o usuário de desenvolvimento (idempotente). |
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

Migrations e seed:

```bash
npm run db:migrate   # aplica/cria migrations em desenvolvimento
npm run prisma:seed  # popula o usuário inicial de desenvolvimento
```

Não há rede externa `arthemis-edge` nem serviço de aplicação no Compose: a
integração com o Traefik/gateway fica para a task de deploy.
