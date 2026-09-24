# Arthemis Web

Frontend do Arthemis em **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, localizado em `apps/web`. Os design tokens (cores, fontes, raio e resets) foram portados do projeto legado em `legacy/front` (SvelteKit + shadcn-svelte).

## Stack

| Camada    | Tecnologia                                |
| --------- | ----------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)        |
| Linguagem | TypeScript 5 (strict)                     |
| Estilo    | Tailwind CSS 4 (`@tailwindcss/postcss`)   |
| Fontes    | Instrument Sans + Lora (`@fontsource-variable`, self-hosted) |
| Lint      | ESLint 9 (`eslint-config-next`)           |
| Deploy    | Docker (multi-stage) + Docker Compose     |

## Estrutura

```text
apps/web
├── Dockerfile                 # multi-stage: deps → dev → build → runner
├── docker-compose.yml         # serviço `web` na porta 3000 (dev) + perfil `prod`
├── .dockerignore
├── .env.example               # modelo das variáveis de ambiente
├── tailwind.config.ts         # espelho JS dos tokens (carregado via @config)
├── public/
│   ├── favicon.svg            # asset legado
│   └── robots.txt             # asset legado
└── src
    ├── app
    │   ├── globals.css        # design tokens (paleta sage-green, shadcn, fontes, resets)
    │   ├── layout.tsx         # fontes + metadata + classes base
    │   └── page.tsx
    └── lib
        └── api.ts             # cliente HTTP (fetch) com NEXT_PUBLIC_API_URL + Bearer
```

## Design tokens (portados do legado)

- **Paleta**: `sage-green` (50–950, incluindo steps 150/450/850) em oklch — `legacy/front/src/app.css`.
- **Tokens semânticos shadcn**: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar*`, `chart-1/2` — claros em `:root` e escuros em `.dark`.
- **Fontes**: `font-sans` → Instrument Sans Variable (texto), `font-serif` → Lora Variable (títulos `h1–h6`).
- **Raio**: `--radius: 0.75rem` (escala `sm`…`4xl` derivada).
- **Escuro**: variante `dark` via classe `.dark` no `<html>` (`@custom-variant`).

Observação: no Tailwind v4 as diretivas `@tailwind base/components/utilities` (v3) são substituídas por `@import "tailwindcss"`, que carrega as mesmas três camadas — `globals.css` segue a sintaxe v4 (a única suportada por `@tailwindcss/postcss` v4).

## Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável             | Obrigatória | Default                     | Descrição                          |
| -------------------- | ----------- | --------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`| não         | `http://localhost:3000/api` | URL base do cliente HTTP (`src/lib/api.ts`). |

## Cliente HTTP

```ts
import { api, setAuthToken, ApiError } from "@/lib/api";

setAuthToken(token);                       // persiste o Bearer em localStorage
const users = await api.get<User[]>("/users");
await api.post("/auth/login", { body: { email, password } });
```

- Base: `NEXT_PUBLIC_API_URL` (sem barra final).
- Headers: `Accept` + `Content-Type: application/json` automáticos.
- Bearer: token global (`setAuthToken`/`setTokenGetter`) ou por requisição (`{ token }`); `token: null` força sem token.
- Erros fora de 2xx lançam `ApiError` com `status` e `body`.

## Desenvolvimento local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção (valida TypeScript)
npm run lint       # ESLint
```

## Docker

Pré-requisito: a rede externa do backend é criada pelo Compose da API (se o Postgres não estiver no ar):

```bash
docker compose -f ../api/docker-compose.yml up -d   # cria arthemis-api_api-internal
```

```bash
# Desenvolvimento (hot-reload, bind mount, porta 3000)
docker compose up -d

# Produção (estágio runner do Dockerfile, standalone)
docker compose --profile prod up -d --build web-prod

docker compose down
```

O serviço participa das redes `arthemis-web_default` e `arthemis-api_api-internal` (backend PostgreSQL/NestJS), permitindo alcançar o banco por `postgres:5432` a partir do container do frontend.

