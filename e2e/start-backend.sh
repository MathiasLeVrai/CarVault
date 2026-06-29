#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

# Playwright / CI injectent DATABASE_URL — ne jamais écraser si déjà défini.
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${CI:-}" ]; then
    export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/carvault_e2e"
  else
    export DATABASE_URL="postgresql://${USER}@127.0.0.1:5432/carvault_e2e"
  fi
fi

export JWT_SECRET="${JWT_SECRET:-e2e-local-secret}"
export NODE_ENV="${NODE_ENV:-test}"
export PORT="${PORT:-3001}"

if command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
    echo "e2e: PostgreSQL absent sur 127.0.0.1:5432."
    echo "     macOS (Homebrew): brew install postgresql@16 && brew services start postgresql@16"
    exit 1
  fi
fi

# Crée la base si possible — ne bloque pas si elle existe déjà.
if command -v createdb >/dev/null 2>&1; then
  createdb carvault_e2e 2>/dev/null || true
elif command -v psql >/dev/null 2>&1; then
  ADMIN_URL="${DATABASE_URL%/*}/postgres"
  psql "$ADMIN_URL" -tc "SELECT 1 FROM pg_database WHERE datname = 'carvault_e2e'" 2>/dev/null | grep -q 1 \
    || psql "$ADMIN_URL" -c "CREATE DATABASE carvault_e2e" 2>/dev/null \
    || true
fi

DATABASE_URL="$DATABASE_URL" npx prisma generate
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
exec node src/index.js
