#!/bin/sh
set -e

echo "🚀 [PetRankings] Sincronizando schema do banco de dados (Prisma)..."
npx prisma db push --skip-generate || echo "⚠️ Aviso: db push falhou. Continuando..."

echo "🐾 [PetRankings] Iniciando servidor Next.js..."
exec "$@"
