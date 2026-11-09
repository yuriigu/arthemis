# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS dependencies

WORKDIR /workspace/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:24-bookworm-slim AS build

WORKDIR /workspace/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /workspace/apps/web/node_modules ./node_modules
COPY apps/web ./
RUN npm run build

FROM dependencies AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3001"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
WORKDIR /app

COPY --chown=node:node --from=build /workspace/apps/web/public ./public
COPY --chown=node:node --from=build /workspace/apps/web/.next/standalone ./
COPY --chown=node:node --from=build /workspace/apps/web/.next/static ./.next/static

EXPOSE 3001
USER node
CMD ["node", "server.js"]
