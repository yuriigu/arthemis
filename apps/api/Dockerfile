# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS dependencies

WORKDIR /workspace
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --filter @arthemis/api...

FROM dependencies AS build
COPY apps/api apps/api
COPY packages/database packages/database
ENV DATABASE_URL=postgresql://arthemis:build-only@localhost:5432/arthemis?schema=public
RUN pnpm --filter @arthemis/api build

FROM dependencies AS development
ENV NODE_ENV=development
ENV PORT=3000
WORKDIR /workspace/apps/api
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @arthemis/database exec prisma migrate deploy && pnpm --filter @arthemis/api start:dev"]

FROM node:24-bookworm-slim AS production-dependencies

WORKDIR /workspace
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --prod --frozen-lockfile --filter @arthemis/api...

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace

COPY --from=production-dependencies /workspace/node_modules ./node_modules
COPY --from=production-dependencies /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=production-dependencies /workspace/packages/database/node_modules ./packages/database/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/packages/database/dist ./packages/database/dist
COPY --from=build /workspace/packages/database/package.json ./packages/database/package.json
COPY apps/api/package.json ./apps/api/package.json

WORKDIR /workspace/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
