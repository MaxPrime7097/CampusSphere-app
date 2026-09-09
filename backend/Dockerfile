# CampusSphere API — Node/Express.
#
# Deliberately still a Docker runtime rather than Render's native Node runtime:
# the Sphera extraction pipeline shells out to the tesseract and poppler binaries,
# which a managed Node runtime does not provide. Keeping `runtime: docker` also
# means render.yaml, the service, its URL and its health check path are unchanged
# from the Django deployment.

FROM node:22-slim

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

# Extraction dependencies. Same set the Django image installed, for the same
# reason — scanned PDFs fall through to OCR when embedded text is too sparse.
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

# Dependency layer first so application edits do not invalidate the install cache.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Prisma client must be generated before the TypeScript build, which imports its types.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx tsc --project tsconfig.build.json

# Drop dev dependencies; the generated Prisma client and its engines live in
# node_modules/.prisma and survive the prune.
RUN npm prune --omit=dev

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Render injects PORT; 10000 matches the value render.yaml sets.
ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/api/health/" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
