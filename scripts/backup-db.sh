#!/bin/bash
set -e

# ==============================================================================
# PetRankings — Rotina de Backup Automático do Banco PostgreSQL
# Executa pg_dump compactado com gzip e mantém os últimos 30 dias no disco.
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups_postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/petrankings_backup_$TIMESTAMP.sql.gz"

# Garante que o diretório de destino existe
mkdir -p "$BACKUP_DIR"

echo "----------------------------------------------------------------------"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup do banco PetRankings..."

# Executa o dump diretamente do container PostgreSQL compactando em tempo real
docker exec petrankings-postgres pg_dump -U petrankings petrankings | gzip > "$FILENAME"

# Verifica se o arquivo foi gerado com sucesso e tem tamanho maior que zero
if [ -s "$FILENAME" ]; then
    FILESIZE=$(ls -lh "$FILENAME" | awk '{print $5}')
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Backup concluído com sucesso: $FILENAME"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Tamanho do backup: $FILESIZE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Erro: O arquivo de backup foi gerado vazio!"
    exit 1
fi

# Limpeza automática: remove backups com mais de 30 dias para não acumular lixo
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "petrankings_backup_*.sql.gz" -mtime +30 | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -type f -name "petrankings_backup_*.sql.gz" -mtime +30 -delete
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 Limpeza: $DELETED_COUNT backup(s) antigo(s) (>30 dias) removido(s)."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotina de backup finalizada."
echo "----------------------------------------------------------------------"
