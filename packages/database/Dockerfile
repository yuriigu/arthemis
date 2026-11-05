FROM node:24-bookworm-slim AS build

WORKDIR /workspace
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile --filter @arthemis/database...

COPY packages/database packages/database
ARG DATABASE_URL=postgresql://arthemis:build-only@localhost:5432/arthemis?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm --filter @arthemis/database build

FROM scratch AS artifact
COPY --from=build /workspace/packages/database/dist /dist
COPY --from=build /workspace/packages/database/package.json /package.json
