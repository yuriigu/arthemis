# syntax=docker/dockerfile:1
# Arthemis API NestJS + Prisma — imagem de desenvolvimento/produção.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8081 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# `procps` fornece o `ps`, exigido pelo tree-kill do `nest start --watch` para
# reiniciar o app sem EADDRINUSE em containers mínimos (nest-cli#484).
RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl ca-certificates procps \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

# Estágio de desenvolvimento com hot-reload (usado pelo docker-compose.yml da
# raiz). O código-fonte é bind-mounted pelo Compose; o `prisma generate` e as
# migrations rodam no start porque o client gerado não é versionado.
FROM deps AS dev
ENV NODE_ENV=development
COPY prisma.config.ts nest-cli.json tsconfig*.json ./
COPY prisma ./prisma
EXPOSE 8081
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]

FROM deps AS build
# O comando do Prisma 7 usa a configuração em prisma.config.ts. A URL abaixo
# é apenas placeholders para gerar o client; em runtime o Compose injeta a URL
# real do PostgreSQL.
ENV DATABASE_URL=postgresql://arthemis:arthemis@localhost:5432/arthemis
COPY prisma.config.ts nest-cli.json tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/src/users ./src/users
COPY --from=build /app/prisma ./prisma
COPY --from=deps /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
USER node
EXPOSE 8081
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
