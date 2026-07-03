#!/bin/sh
set -e

echo "▶ Application des migrations Prisma…"
npx prisma migrate deploy

echo "▶ Démarrage de Carvio sur le port ${PORT:-8080}…"
exec node src/index.js
