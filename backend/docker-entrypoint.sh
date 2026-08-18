#!/bin/sh
# Apply pending migrations, then hand off to the process in CMD.
#
# `migrate deploy` only applies already-generated migrations and never prompts or
# rewrites history, which is what makes it safe to run on container start.
#
# ── Running more than one instance ──────────────────────────────────────────
# Every instance boots this script, so N instances all attempt the migration at
# once. That is *safe* — Prisma takes a Postgres advisory lock, so the runs
# serialise rather than corrupt each other — but it is wasteful: each instance
# waits for the lock before it can bind its port, and on a slow migration that can
# push boot past Render's health-check window.
#
# The better arrangement once scaled out is Render's pre-deploy command, which runs
# exactly once per deploy, before any new instance starts:
#
#     preDeployCommand: npx prisma migrate deploy
#
# Set RUN_MIGRATIONS_ON_START=false alongside it so the work is not done twice.
# Enabled by default, because a single-instance service with no pre-deploy command
# still needs its migrations applied from somewhere.
set -e

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "false" ]; then
  echo "[entrypoint] RUN_MIGRATIONS_ON_START=false — skipping migrations (expecting a pre-deploy command)"
else
  echo "[entrypoint] applying database migrations"
  npx prisma migrate deploy
fi

echo "[entrypoint] starting: $*"
exec "$@"
