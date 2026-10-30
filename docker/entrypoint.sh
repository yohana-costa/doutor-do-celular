#!/bin/sh
set -eu

echo "[api] aplicando migrations..."
npx prisma migrate deploy

echo "[api] iniciando..."
exec node backend/dist/server.js
