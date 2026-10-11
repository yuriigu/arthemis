# syntax=docker/dockerfile:1
# Arthemis API NestJS + Prisma — imagem de desenvolvimento e execução standalone.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8081 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Instala pacotes do sistema necessários: openssl para o Prisma, ca-certificates e procps (ps para nest-cli watch)
RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl ca-certificates procps \
    && rm -rf /var/lib/apt/lists/*

# Estágio de instalação de dependências limpas a partir do package-lock.json
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

# Estágio de build: gera o Prisma Client e compila a API NestJS para dist/
FROM deps AS build
ENV DATABASE_URL=postgresql://arthemis_user:arthemis_password@localhost:5432/arthemis_db?schema=public
COPY prisma.config.ts nest-cli.json tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

# Estágio de desenvolvimento com hot-reload (utilizado quando target: dev é definido no Compose)
FROM deps AS dev
ENV NODE_ENV=development
COPY prisma.config.ts nest-cli.json tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src
EXPOSE 8081
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]

# Estágio final (runner): executa a aplicação compilada e aplica migrations no startup
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=deps /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 8081
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
