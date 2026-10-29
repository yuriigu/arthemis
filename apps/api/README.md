# Arthemis API

Backend do Arthemis em Nest.js. Esta é a base criada na **Task #1** (setup da API
e infraestrutura de banco), que substitui gradualmente os serviços legados em Go
(`legacy/brain`, `legacy/edge`, `legacy/watcher`).

O que já existe:

- Esqueleto Nest.js rodando na porta **8081** (compatível com o gateway Traefik legado).
- Validação de variáveis de ambiente no boot (fail-fast).
- Prisma ORM configurado com driver adapter `pg` (models `User`, `Organization`, `Project`, `ProjectOrganization`, `Sdg`, `ProjectSdg`, `Activity`, `Indicator`, `Location` e `Observation` + migrations aplicadas).
- `docker-compose.yml` sobe o PostgreSQL 16 e a API NestJS containerizada, com migrations aplicadas no startup.
- `GET /healthcheck` com ping real no banco (200/503).
- Módulo de usuários (`POST /users`, `GET /users/:id`) com hash bcrypt e seed inicial.
- Módulo de autenticação (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) com JWT (HS256), cookie HttpOnly e guards globais.
- Modelagem de organizações, projetos e ODS (migration `add_organization_project_sdg_models`) com UUID, soft delete e seed dos 17 ODS.
- Módulo de organizações (`/organizations`) com CRUD, listagem paginada, unicidade de e-mail (409), soft delete bloqueado por vínculos (409) e `JwtAuthGuard`.

## Stack

| Camada    | Tecnologia                                        |
| --------- | ------------------------------------------------- |
| Runtime   | Node.js 22+                                       |
| Framework | Nest.js 12 (TypeScript, ESM)                      |
| ORM       | Prisma 7 (`prisma-client` + `@prisma/adapter-pg`) |
| Banco     | PostgreSQL 16 (Docker Compose)                    |
| Testes    | Vitest + Supertest                                |
| Lint      | oxlint + Prettier                                 |

## Estrutura

```text
apps/api
├── prisma/schema.prisma          # models User/Organization/Project/Activity/Indicator/Location/Observation + generator/datasource
├── prisma/migrations/            # create_users_table + add_organization_project_sdg_models (aplicadas)
├── prisma/seed.ts                # seed idempotente: 17 ODS + usuário inicial
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
    ├── modules/organizations/       # OrganizationsModule/Controller/Service/Repository + DTOs (CRUD + seletores)
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

| Variável            | Obrigatória   | Default        | Descrição                                                         |
| ------------------- | ------------- | -------------- | ----------------------------------------------------------------- |
| `PORT`              | não           | `8081`         | Porta HTTP da API.                                                |
| `SERVICE_NAME`      | não           | `arthemis-api` | Valor do campo `service` no healthcheck.                          |
| `NODE_ENV`          | não           | `development`  | `development`, `test` ou `production`.                            |
| `DATABASE_URL`      | **sim**       | —              | Connection string usada pelo Prisma.                              |
| `POSTGRES_USER`     | sim (Compose) | —              | Usuário criado no container.                                      |
| `POSTGRES_PASSWORD` | sim (Compose) | —              | Senha do usuário.                                                 |
| `POSTGRES_DB`       | sim (Compose) | —              | Nome do banco.                                                    |
| `JWT_SECRET`        | **sim**       | —              | Segredo de assinatura HS256 do JWT (mínimo 32 caracteres).        |
| `JWT_EXPIRES_IN`    | não           | `24h`          | Validade do `access_token` (formato do `ms`: `15m`, `24h`, `7d`). |
| `THROTTLE_TTL`      | não           | `60000`        | Janela do rate limit global, em milissegundos.                    |
| `THROTTLE_LIMIT`    | não           | `100`          | Máximo de requisições por IP em cada janela global.               |

A validação (`src/config/env.validation.ts`) roda no boot: sem `DATABASE_URL` a
aplicação encerra com erro em vez de subir sem banco — comportamento herdado do
serviço `auth` legado. As variáveis `POSTGRES_*` são exigidas pelo
`docker-compose.yml` (o Compose falha explicitamente se faltarem) e devem bater
com a `DATABASE_URL`.

## Documentação e rate limiting

O Swagger UI fica disponível em `/api/docs` e descreve os endpoints, parâmetros
e DTOs da API. A autenticação usa o cookie HttpOnly `arthemis_token`.

O limitador global responde `429` no formato padrão de erro. Ele permite até
`THROTTLE_LIMIT` requisições por IP a cada `THROTTLE_TTL` milissegundos.

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

| Método | Rota         | Comportamento                                                                                                                   |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/users`     | `201` com `{ id, email, role, createdAt, updatedAt }`; `400` corpo inválido; `409` e-mail já cadastrado; `401` sem autenticação |
| `GET`  | `/users/:id` | `200` com o usuário (sem hash); `400` id que não é UUID; `401` sem autenticação; `403` sem papel admin; `404` não encontrado    |

As rotas exigem autenticação por padrão. `GET /`, `GET /healthcheck`,
`POST /auth/login` e `POST /auth/logout` são públicas; `GET /users/:id` exige
também o papel `admin`.

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

## Organizações, projetos e ODS

Modelagem de domínio portada do legado (`legacy/brain/internal/models`, tabelas
criadas pelo `AutoMigrate` do gorm) e consumida pelo
`legacy/watcher/internal/models/brain.go`. As tabelas mantêm os **nomes físicos
do legado** (`@@map`), usam **UUID** como PK e **soft delete** (`deleted_at`) em
todas as entidades de domínio. Os relacionamentos são bidirecionais.

| Model                 | Tabela                  | Observações                                                                                      |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `Organization`        | `organizations`         | organização organização (`name`, `email`).                                                       |
| `Project`             | `projects`              | `organization_id` (FK), `name` varchar(150), `lifetime_start/end` (`date`), `justification`.     |
| `ProjectOrganization` | `project_organizations` | N:N projeto↔organização com `role`; unique `(project_id, organization_id)`.                      |
| `Sdg`                 | `sdgs`                  | ODS da ONU: `number` **único** (1..17), `name`, `icon_url`.                                      |
| `ProjectSdg`          | `project_sdg`           | N:N projeto↔ODS; unique `(project_id, sdg_id)`.                                                  |
| `Activity`            | `activities`            | Projeto 1:N; `name`, `description`, `justification`, datas civis de início/fim; indicadores 1:N. |
| `ActivityLocation`    | `activity_locations`    | N:N entre atividades e localizações, com soft delete do vínculo.                                 |
| `Indicator`           | `indicators`            | Atividade/localização; valores de baseline e referência; observações 1:N.                        |
| `Location`            | `locations`             | Projeto 1:N; nome, descrição, ecossistema, extensão, país e posição JSONB.                       |
| `Observation`         | `observations`          | Indicador 1:N; valor, data civil e posição JSONB.                                                |

`Project.status` usa `Draft`, `Listed`, `Under_Assessment` ou `Verified`,
inicia em `Draft` e tem a constraint SQL `chk_projects_status`. A transição para
`Listed` via `PATCH /projects/:id` exige justificativa não vazia e ao menos uma
localização ativa; caso contrário, a API responde `422`.

O model `User` ganhou, com paridade ao legado
(`legacy/brain/internal/models/user.go`):

- `username` (varchar(150), **único**) — opcional no banco porque o `POST /users`
  atual cria o usuário só com e-mail/senha;
- `organization_id` → `organizations.id`, o relacionamento **opcional** `User -> Organization`
  (`ON DELETE SET NULL`).

### Seed dos ODS

O mesmo `npm run prisma:seed` popula os **17 Objetivos de Desenvolvimento
Sustentável** da ONU (`sdgs`) com `upsert` pela chave natural `number`:

```bash
npm run prisma:seed
# [seed] sdgs ready: 17 ODS (idempotente)
# [seed] user ready: { ... }
```

Rodar quantas vezes for preciso não duplica registros. As URLs dos ícones
apontam para a arte oficial da ONU publicada pelo projeto
[open-sdg](https://open-sdg.org/sdg-translations/icons/) (as URLs diretas do
`un.org` não são estáveis/hotlinkáveis).

### Migrations e testes do schema

```bash
npm run db:migrate          # cria/aplica migrations em desenvolvimento (prisma migrate dev)
npx prisma migrate deploy   # aplica as migrations pendentes (também usado no startup)
npm run prisma:generate     # regenera o Prisma Client em src/generated/prisma
npm run test:integration    # test/prisma.integration-spec.ts (+ users/auth)
```

`test/prisma.integration-spec.ts` valida: migrations aplicando em **banco limpo
sem erro de FK/constraint** (schema descartável + `prisma migrate deploy`), as
uniques compostas e a FK `users.organization_id`, a associação `User <-> Organization`
com leitura do `username` e a idempotência do seed (17 ODS após duas execuções).

### Projeção e observação

As rotas abaixo são autenticadas e retornam registros ativos (filtro
`deleted_at IS NULL`). As listagens aceitam `page` e `limit` (padrões `1` e
`10`, máximo `100`); `activities`, `indicators` e `locations` também aceitam
filtros pelos relacionamentos e `search`.

| Método  | Rota                | Comportamento                                                                                                                                                                            |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/activities`       | Cria atividade; aceita `projectId`, `name`, `startDate`, `endDate`, descrição, justificativa e `locationIds` opcionais. Datas devem ser `YYYY-MM-DD` e o fim não pode preceder o início. |
| `GET`   | `/activities`       | Lista atividades; filtros opcionais `projectId` e `search`.                                                                                                                              |
| `GET`   | `/activities/:id`   | Consulta atividade e seus `locationIds` ativos.                                                                                                                                          |
| `PATCH` | `/activities/:id`   | Atualiza parcialmente atividade, datas e localidades vinculadas.                                                                                                                         |
| `POST`  | `/indicators`       | Cria indicador com `activityId`, `locationId`, `name`, valores baseline/referência e campos textuais opcionais.                                                                          |
| `GET`   | `/indicators`       | Lista indicadores; filtros opcionais `activityId`, `locationId` e `search`.                                                                                                              |
| `GET`   | `/indicators/:id`   | Consulta indicador.                                                                                                                                                                      |
| `PATCH` | `/indicators/:id`   | Atualiza parcialmente indicador e seus vínculos de atividade/localidade.                                                                                                                 |
| `POST`  | `/locations`        | Cria localidade com `projectId`, `name`, `ecosystem`, `extent`, `country`; `description` e `position` JSON são opcionais.                                                                |
| `GET`   | `/locations`        | Lista localizações; filtros opcionais `projectId` e `search`.                                                                                                                            |
| `GET`   | `/locations/:id`    | Consulta localização.                                                                                                                                                                    |
| `PATCH` | `/locations/:id`    | Atualiza parcialmente localidade e posição GeoJSON.                                                                                                                                      |
| `POST`  | `/observations`     | Cria observação com `indicatorId`, `value`, data `YYYY-MM-DD` e `position` JSON opcional.                                                                                                |
| `GET`   | `/observations`     | Lista observações; filtro opcional `indicatorId`.                                                                                                                                        |
| `GET`   | `/observations/:id` | Consulta observação.                                                                                                                                                                     |
| `PATCH` | `/observations/:id` | Atualiza parcialmente observação, data, valor, posição e indicador vinculado.                                                                                                            |

Criação responde `201`; corpo inválido responde `400`, referências inexistentes
ou removidas logicamente respondem `404`, e identificadores de rota inválidos
respondem `400`.

## Autenticação

Portabilidade do serviço `auth` legado (`legacy/edge/services/auth`): login com
JWT **HS256**, claims `sub` (UUID do usuário), `email` e `role`, validade de
`JWT_EXPIRES_IN` (default 24h — igual ao `exp` fixo do legado) e verificação do
`Authorization: Bearer` ou cookie `arthemis_token` pelo
`JwtAuthGuard`/`JwtStrategy`. O login define esse cookie como HttpOnly, SameSite
Lax e Secure em produção.

| Método | Rota           | Comportamento                                                                            |
| ------ | -------------- | ---------------------------------------------------------------------------------------- |
| `POST` | `/auth/login`  | `200` com `{ "access_token": "..." }`; `400` corpo inválido; `401` credenciais inválidas |
| `POST` | `/auth/logout` | `200` e limpa o cookie de autenticação                                                   |
| `GET`  | `/auth/me`     | `200` com o perfil do usuário do token (sem hash); `401` sem token, inválido ou expirado |

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
- `request.user.id` e `request.user.sub` correspondem à claim `sub`; as rotas
  privadas usam os guards globais e as públicas são marcadas explicitamente.

```bash
# login
curl -i -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@arthemis.local","password":"arthemis-dev-123"}'

# rota protegida (troque <token> pelo access_token retornado acima)
curl -i http://localhost:8081/auth/me -H 'Authorization: Bearer <token>'
```

## Organizações (CRUD + seletores)

Portabilidade do `OrganizationHandler` legado
(`legacy/brain/internal/handlers/organization.go`) para a arquitetura em camadas
(`src/modules/organizations`), com as regras de negócio que o legado não tinha. O
recurso é `/organizations` (plural, REST) e **todas as rotas exigem Bearer válido**
(`JwtAuthGuard`) — no legado o gateway Traefik fazia o `forwardAuth`.

| Método   | Rota                                     | Sucesso                                                        | Erros                                                   |
| -------- | ---------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| `GET`    | `/organizations?page=1&limit=10&search=` | `200` `{ data, meta }` paginado                                | `400` query fora do contrato; `401`                     |
| `POST`   | `/organizations`                         | `201` organização criado                                       | `400` corpo inválido; `401`; `409` e-mail duplicado     |
| `GET`    | `/organizations/:id`                     | `200` organização                                              | `400` id não-UUID; `401`; `404`                         |
| `PATCH`  | `/organizations/:id`                     | `200` organização atualizado (`PartialType` do DTO de criação) | `400`; `401`; `404`; `409` e-mail duplicado             |
| `DELETE` | `/organizations/:id`                     | `204` (soft delete via `deleted_at`)                           | `400`; `401`; `404`; `409` projetos/usuários vinculados |

Regras de negócio:

- **e-mail único**: `POST`/`PATCH` respondem `409 Conflict` quando já existe
  organização **ativo** com o mesmo e-mail (normalizado com `trim + lowercase`). O
  `email` do schema **não** é `unique` (paridade com o gorm legado, que só exigia
  `not null`), então a checagem é feita na camada de serviço; o e-mail de um
  organização excluído logicamente pode ser reaproveitado;
- **listagem paginada**: `GET /organizations` devolve `{ data, meta }` com
  registros ativos ordenados por `name`. `page` (padrão `1`) e `limit` (padrão
  `10`, máximo `100`) controlam a paginação; `search` filtra por trecho do nome
  (case-insensitive, `ILIKE`). `meta` inclui `total`, `page`, `limit` e
  `totalPages`;
- **política de exclusão**: `DELETE` aplica **soft delete** (`deleted_at`) e
  responde `409 Conflict` quando ainda existem **projetos ativos**
  (`projects.deleted_at IS NULL`) ou **usuários vinculados** (`users.organization_id`)
  — o legado apagava o organização e deixava projeto órfão, já que a FK não existia;
- o `deletedAt` nunca aparece na resposta (`select` público + `WHERE deleted_at IS
NULL` no repositório).
- erros HTTP usam o envelope `{ code, message, details, timestamp }`; erros
  inesperados respondem `500` sem expor detalhes internos.

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@arthemis.local","password":"arthemis-dev-123"}' \
  | sed -E 's/.*"access_token":"([^"]+)".*/\1/')

# listagem para seletor (sem registros => 200 [])
curl -i http://localhost:8081/organizations -H "Authorization: Bearer $TOKEN"

# criação (409 se o e-mail já existir)
curl -i -X POST http://localhost:8081/organizations \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Instituto Arthemis","email":"contato@arthemis.test"}'

# exclusão lógica (409 se houver projeto/usuário vinculado)
curl -i -X DELETE http://localhost:8081/organizations/<id> \
  -H "Authorization: Bearer $TOKEN"
```

Testes do módulo: `src/modules/organizations/*.spec.ts` (unitários do
service/repository), `test/organizations.e2e-spec.ts` (contrato HTTP + guard, sem
banco) e `test/organizations.integration-spec.ts` (soft delete e travas de vínculo
no Postgres real).

## Scripts

| Script                     | Descrição                                                     |
| -------------------------- | ------------------------------------------------------------- |
| `npm run start:dev`        | Sobe a API em modo watch.                                     |
| `npm run start:prod`       | Executa o build (`dist/`).                                    |
| `npm run build`            | Compila o projeto.                                            |
| `npm test`                 | Testes unitários (Vitest).                                    |
| `npm run test:e2e`         | Testes de contrato HTTP (sem banco).                          |
| `npm run test:integration` | Testes com o PostgreSQL real (requer `docker compose up -d`). |
| `npm run lint`             | oxlint.                                                       |
| `npm run format`           | Prettier.                                                     |
| `npm run prisma:generate`  | Gera o Prisma Client em `src/generated/prisma`.               |
| `npm run prisma:seed`      | Cria/atualiza o usuário de desenvolvimento (idempotente).     |
| `npm run db:migrate`       | Cria/aplica migrations em desenvolvimento.                    |
| `npm run db:push`          | Sincroniza o schema com o banco sem gerar migration.          |

## Banco de dados e Docker

A infraestrutura local do backend pode ser executada de forma isolada através do `docker-compose.yml` da pasta `apps/api`, que orquestra o **PostgreSQL 16** (`postgres`) e a **API NestJS** (`api`) na rede interna `api-internal`.

### Pré-requisitos

- **Docker Desktop** instalado no Windows com a engine WSL2 ativa. O aplicativo Docker Desktop precisa estar em execução (ícone da baleia na bandeja do sistema).
- **Node.js 22+** e **npm 10+** (para comandos locais e testes fora do container).

### Configuração de Ambiente (.env)

Antes de subir os serviços, crie seu arquivo `.env` a partir do modelo:

```powershell
# No Windows PowerShell (dentro de apps/api):
Copy-Item .env.example .env
```

O arquivo define:

- Credenciais do banco: `POSTGRES_USER=arthemis_user`, `POSTGRES_PASSWORD=arthemis_password`, `POSTGRES_DB=arthemis_db`
- Connection string para conexão local no Windows: `DATABASE_URL="postgresql://arthemis_user:arthemis_password@localhost:5432/arthemis_db?schema=public"`
- O Docker Compose injeta automaticamente o hostname `postgres` dentro da rede de containers para a API.

---

### Comandos de Operação (Windows PowerShell)

#### 1. Executados no Host (pasta `apps/api`)

```powershell
# Subir o PostgreSQL e a API em background (com build):
docker compose up -d --build

# Verificar o estado dos containers e healthchecks:
docker compose ps

# Acompanhar os logs da API em tempo real:
docker compose logs -f api

# Acompanhar os logs do PostgreSQL:
docker compose logs -f postgres

# Reiniciar a API (após alterações ou para recarregar ambiente):
docker compose restart api

# Parar os serviços mantendo os dados salvos:
docker compose down

# Parar os serviços e apagar os volumes de dados (limpeza completa):
docker compose down -v
```

#### 2. Executados dentro dos Containers (via `docker compose exec`)

```powershell
# Aplicar migrations pendentes do Prisma no banco do container:
docker compose exec api npx prisma migrate deploy

# Executar o seed inicial (cria usuário admin e os 17 ODS):
docker compose exec api npm run prisma:seed

# Abrir o Prisma Studio para visualizar dados pelo navegador:
docker compose exec api npx prisma studio

# Acessar o terminal interativo psql no container do banco:
docker compose exec postgres psql -U arthemis_user -d arthemis_db
```

#### 3. Executados no Host fora do Docker (desenvolvimento híbrido)

Se preferir rodar apenas o banco no Docker e a API rodando no Node.js local:

```powershell
# 1. Suba apenas o PostgreSQL:
docker compose up -d postgres

# 2. Gere o Prisma Client localmente:
npm run prisma:generate

# 3. Aplique as migrations no banco:
npm run db:migrate

# 4. Inicie a API com hot-reload no seu terminal:
npm run start:dev
```

---

### Acesso à API e Verificação de Saúde

- **Acesso HTTP**: `http://localhost:8081`
- **Smoke test**: `GET http://localhost:8081/` -> Responde `Hello World!`
- **Healthcheck do banco e API**: `GET http://localhost:8081/healthcheck`
  - Responde `200 OK` com status `{"status": "ok", "checks": {"database": {"status": "up"}}}` quando a conexão com o PostgreSQL está operante.

---

### Conexão ao PostgreSQL por Ferramentas Externas (Host Windows)

Você pode conectar clientes SQL (DBeaver, pgAdmin, TablePlus, VSCode Database Client, etc.) rodando diretamente no Windows utilizando a porta mapeada `5432`:

| Parâmetro    | Valor                      |
| :----------- | :------------------------- |
| **Host**     | `localhost` ou `127.0.0.1` |
| **Porta**    | `5432`                     |
| **Database** | `arthemis_db`              |
| **Usuário**  | `arthemis_user`            |
| **Senha**    | `arthemis_password`        |
| **Schema**   | `public`                   |

---

### Persistência de Dados

Os dados do banco de dados são mantidos de forma persistente através do volume nomeado `arthemis_api_postgres_data` montado em `/var/lib/postgresql/data`.
Executar `docker compose down` preserva o volume e todos os dados gravados. Apenas o uso explícito da flag `-v` (`docker compose down -v`) descarta o volume.

---

### Solução de Problemas Comuns (Troubleshooting)

1. **Erro `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`**:
   - **Causa**: O aplicativo Docker Desktop está fechado ou o daemon WSL2 não concluiu a inicialização no Windows.
   - **Solução**: Abra o Docker Desktop pelo Menu Iniciar do Windows e aguarde a indicação verde "Engine running" no canto inferior esquerdo da janela do Docker Desktop antes de executar comandos `docker compose`.

2. **Erro `bind: address already in use` na porta `5432`**:
   - **Causa**: Um serviço PostgreSQL nativo já está em execução no Windows na porta padrão `5432`.
   - **Solução**: No PowerShell, pare o serviço local do Windows (`Stop-Service postgresql* -ErrorAction SilentlyContinue`) ou altere a porta mapeada do host em `ports: - "5433:5432"` no `docker-compose.yml`.

3. **API falha no boot com `PrismaClientInitializationError` / `Can't reach database server`**:
   - **Causa**: A API tentou conectar antes de o PostgreSQL estar pronto ou o hostname na connection string está incorreto.
   - **Solução**: No container, a API deve utilizar o hostname `postgres` (garantido automaticamente via variável de ambiente no `docker-compose.yml`). O `depends_on` com `condition: service_healthy` garante que a API só inicia após o `pg_isready` responder com sucesso.

4. **Erro ao rodar seed (`seed.ts`)**:
   - **Causa**: As migrations ainda não foram aplicadas na base limpa.
   - **Solução**: Execute `docker compose exec api npx prisma migrate deploy` antes de rodar `docker compose exec api npm run prisma:seed`.
