# syntax=docker/dockerfile:1
# Arthemis API NestJS + Prisma — imagem de desenvolvimento/produção.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

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
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
