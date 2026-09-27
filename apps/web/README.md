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
    │   ├── api/auth/            # proxy de login, perfil e logout
    │   ├── (auth)/login/        # tela de login
    │   ├── dashboard/           # rota privada de exemplo
    │   ├── globals.css          # design tokens (paleta sage-green, shadcn, fontes, resets)
    │   ├── layout.tsx           # fontes + metadata + AuthProvider
    │   └── page.tsx
    ├── contexts/AuthContext.tsx # estado global de autenticação
    ├── lib
    │   ├── api.ts               # cliente HTTP público (fetch)
    │   ├── api-server.ts        # cliente HTTP privado do Next → NestJS
    │   └── auth/                # constantes e helpers server-side do cookie
    └── middleware.ts             # proteção de rotas privadas
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

| Variável              | Obrigatória | Default                     | Descrição |
| --------------------- | ----------- | --------------------------- | --------- |
| `NEXT_PUBLIC_API_URL`  | não         | `http://localhost:3000/api` | URL pública do proxy HTTP do frontend; é embutida no bundle. |
| `API_INTERNAL_URL`     | não         | `http://localhost:8081`     | URL privada do NestJS, usada apenas pelo servidor Next. |

## Autenticação e sessão

O formulário em `/login` chama `AuthContext.login()`. O contexto envia a requisição
para `POST /api/auth/login` (Route Handler do Next), que encaminha as credenciais
para `POST http://localhost:8081/auth/login` no backend e grava o JWT no cookie
`arthemis_token`.

- O cookie é `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` quando a requisição é HTTPS (incluindo produção) e dura 24h.
- O `access_token` não é salvo em `localStorage` nem devolvido ao JavaScript.
- `GET /api/auth/me` valida o cookie no NestJS e retorna o perfil ao contexto.
- `POST /api/auth/logout` remove o cookie e redireciona para `/login`.
- `src/middleware.ts` protege `/dashboard` e `/usuarios`; `/login` redireciona
  para `/dashboard` quando o cookie está presente.

A API NestJS ainda não persiste `name`; o frontend usa o prefixo do e-mail como
fallback até o contrato de perfil incluir esse campo.

```ts
import { api, ApiError } from "@/lib/api";

const users = await api.get<User[]>("/users");
await api.post("/auth/login", { body: { email, password } });
// Bearer explícito continua disponível para integrações server-side:
await api.get("/users", { token });
```

- Base pública: `NEXT_PUBLIC_API_URL` (sem barra final).
- Headers: `Accept` + `Content-Type: application/json` automáticos.
- `credentials: "include"` é o padrão para incluir o cookie de sessão.
- Erros fora de 2xx lançam `ApiError` com `status` e `body`.

## Desenvolvimento local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção (valida TypeScript)
npm run lint       # ESLint
```

## Docker

Pré-requisito: suba o Compose do backend primeiro. Ele cria a rede externa
`arthemis-api_api-internal`, o PostgreSQL e o serviço NestJS (`api`):

```bash
docker compose -f ../api/docker-compose.yml up -d --build
```

O Compose do frontend usa `API_INTERNAL_URL=http://api:8081` por padrão. Se a API
NestJS estiver rodando diretamente no host, use o override
`API_INTERNAL_URL=http://host.docker.internal:8081`.

```bash
# Desenvolvimento (hot-reload, bind mount, porta 3000)
docker compose up -d

# Produção (stágio runner do Dockerfile, standalone)
docker compose --profile prod up -d --build web-prod

docker compose down
```

O serviço do frontend participa das redes `arthemis-web_default` e
`arthemis-api_api-internal`; a comunicação com a API containerizada é feita pelo
nome `api:8081`.

