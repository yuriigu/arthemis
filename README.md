# Arthemis

Monorepo do **Arthemis** com backend NestJS, frontend Next.js (App Router),
PostgreSQL e autenticação JWT integrada.

## Tecnologias

- Backend: NestJS 12, Prisma 7 e PostgreSQL 16;
- Frontend: Next.js 16, React 19, TypeScript e Tailwind CSS 4;
- Infraestrutura: Docker, Docker Compose e redes internas.

## Orquestração centralizada

O `docker-compose.yml` na raiz é a entrada canônica para subir o ecossistema
completo (banco, backend e frontend) com um único comando:

```bash
docker compose up --build
```

Serviços expostos:

| Serviço    | URL/local               | Porta host |
| ---------- | ----------------------- | ---------- |
| `db`       | `localhost:5432`        | `5432`     |
| `backend`  | `http://localhost:8081` | `8081`     |
| `frontend` | `http://localhost:3000` | `3000`     |

A rede interna unificada `arthemis` permite que o frontend acesse o backend em
`backend:8081` (`API_INTERNAL_URL`) e que o backend acesse o banco em `db:5432`
(`DATABASE_URL`). Nada além das portas da tabela acima precisa ser conhecido
pelo host.

Ordem de inicialização:

- o banco possui healthcheck nativo `pg_isready`; o backend só inicia depois de
  `service_healthy` e aplica as migrations (`prisma migrate deploy`) no start;
- o backend expõe `GET /healthcheck` (com ping real no banco) e o frontend só
  inicia depois que esse endpoint responde 200.

### Hot-reload em desenvolvimento

O modo padrão é **desenvolvimento**: backend e frontend sobem com os estágios
`dev` dos Dockerfiles e o código-fonte é montado via bind mount no container.
Alterações em `apps/api/src` e `apps/web/src` são recompiladas em tempo real
(`nest start --watch` e `next dev`), sem precisar reconstruir a imagem.

Volumes usados:

| Volume                   | Papel                                                          |
| ------------------------ | -------------------------------------------------------------- |
| `arthemis_postgres_data` | Persiste os dados do PostgreSQL entre execuções.               |
| `backend_node_modules`   | Dependências do backend instaladas na imagem (não sobrescritas).|
| `frontend_node_modules`  | Dependências do frontend instaladas na imagem.                 |
| `frontend_next_cache`    | Cache do `.next` do Next.js.                                   |

> Ao alterar `package.json`/`package-lock.json`, recrie os volumes de módulos
> com `docker compose up --build -V` (ou `docker compose down -v` seguido de
> `docker compose up --build`).

### Variáveis de ambiente

O Compose já possui defaults development-safe, então `up --build` funciona sem
nenhum arquivo. Para sobrescrever, copie o `.env.example`:

```bash
cp .env.example .env
docker compose up --build
```

O `DATABASE_URL` e o `JWT_SECRET` injetados pelo Compose têm precedência sobre o
`apps/api/.env` do host (esse arquivo é apenas visível dentro do container via
bind mount, sem sobrescrever o ambiente do Compose).

### Seed de desenvolvimento

O Compose aplica as migrations automaticamente. Para criar o usuário admin
padrão de desenvolvimento em uma base nova, rode o seed idempotente:

```bash
docker compose exec backend npx prisma db seed
```

### Produção

Para subir as imagens de produção (estágios `runner`, sem bind mount), informe
os serviços explicitamente para não colidir portas com os serviços de dev:

```bash
docker compose --profile prod up -d --build backend-prod frontend-prod
```

### Encerrar

```bash
docker compose down      # encerra sem apagar os dados
docker compose down -v   # remove também o banco e os volumes
```

> Não suba o Compose da raiz e os Compose de `apps/api`/`apps/web` ao mesmo
tempo: todos publicam as portas `5432`/`8081`/`3000`. Os Compose por app
permanecem disponíveis para cenários específicos, mas o comando da raiz é o
recomendado para a stack integrada.

## Desenvolvimento local sem o Compose raiz

```bash
# backend
cd apps/api
npm install
npm run prisma:generate
npm run start:dev

# frontend, em outro terminal
cd apps/web
npm install
npm run dev
```

Consulte `apps/api/README.md` e `apps/web/README.md` para os fluxos específicos
de banco, autenticação, design tokens e Docker.
