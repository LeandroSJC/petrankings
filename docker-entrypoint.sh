#!/bin/sh
set -e

echo "🚀 [PetRankings] Aplicando migrações do banco de dados (Prisma)..."
npx prisma migrate deploy || echo "⚠️ Aviso: migrate deploy falhou ou já está atualizado. Continuando..."

echo "🐾 [PetRankings] Iniciando servidor Next.js..."
exec "$@"
