FROM node:22-slim AS base

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    openssl \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && \
    corepack prepare pnpm@9.15.9 --activate


# ─────────────────────────────
# Dependencies
# ─────────────────────────────

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install \
    --frozen-lockfile \
    --filter @cs/backend...


# ─────────────────────────────
# Build
# ─────────────────────────────

FROM deps AS build

COPY apps/backend apps/backend

WORKDIR /app/apps/backend

RUN pnpm prisma generate
RUN pnpm build


# ─────────────────────────────
# Production
# ─────────────────────────────

FROM base AS production

WORKDIR /app

COPY --from=build /app/apps/backend/dist \
    ./apps/backend/dist

COPY --from=build /app/apps/backend/package.json \
    ./apps/backend/package.json

COPY --from=build /app/apps/backend/prisma \
    ./apps/backend/prisma

COPY --from=build /app/apps/backend/docker-entrypoint.sh \
    ./apps/backend/docker-entrypoint.sh

COPY --from=build /app/node_modules \
    ./node_modules

RUN chmod +x ./apps/backend/docker-entrypoint.sh

RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app

USER app

ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/backend

HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=30s \
    --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/api/health/" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "dist/server.js"]