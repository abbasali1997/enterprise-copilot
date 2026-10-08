# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

WORKDIR /app

RUN npm install --global pnpm@11

ENV CI=true


# ============================================================
# Dependencies
# ============================================================

FROM base AS dependencies

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

COPY apps/web/package.json ./apps/web/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/worker/package.json ./apps/worker/package.json

COPY packages/db/package.json ./packages/db/package.json
COPY packages/llm/package.json ./packages/llm/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile


# ============================================================
# Source
# ============================================================

FROM dependencies AS source

COPY . .


# ============================================================
# Server / Worker target
# ============================================================

FROM source AS app

ENV NODE_ENV=development

EXPOSE 3000

CMD ["pnpm", "--filter", "server", "dev"]


# ============================================================
# React frontend target
# ============================================================

FROM source AS web

ENV NODE_ENV=development

EXPOSE 5173

CMD ["pnpm", "--filter", "web", "dev", "--host", "0.0.0.0"]