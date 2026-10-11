#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "false" ]; then
  echo "[entrypoint] RUN_MIGRATIONS_ON_START=false — skipping migrations (expecting a pre-deploy command)"
else
  echo "[entrypoint] applying database migrations"
  pnpm exec prisma migrate deploy
fi

echo "[entrypoint] starting: $*"
exec "$@"