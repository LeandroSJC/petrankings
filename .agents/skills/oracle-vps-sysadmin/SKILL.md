---
name: oracle-vps-sysadmin
description: >-
  Specialized system administration and DevOps operations for the PetRankings dedicated Oracle Cloud Always Free
  ARM Ampere A1 server (Ubuntu 24.04, 2 OCPUs, 12 GB RAM, 200 GB SSD). Manages Docker Compose multi-container
  orchestration (Next.js, PostgreSQL 16 tuned, Caddy, Umami, Uptime Kuma), SSH tunnel routines, backup retention,
  disaster recovery, fail2ban host security, and zero-downtime remote deployments.
---

# Oracle Cloud VPS & Infrastructure Operator

This skill provides comprehensive operational runbooks, infrastructure topology, security enforcement, and maintenance procedures for the dedicated **Oracle Cloud Always Free ARM Ampere A1** production server running PetRankings.

---

## 1. Server Architecture & Topology

* **Provider & Plan:** Oracle Cloud Infrastructure (OCI) Always Free
* **Compute Architecture:** ARM64 (Ampere A1 — 2 OCPUs, 12 GB RAM)
* **Storage:** 200 GB NVMe Boot Volume SSD (mounted on `/`)
* **Operating System:** Ubuntu 24.04 LTS (Kernel 6.8+ aarch64)
* **Public Server IP:** Configurado no host local via alias `petrankings-vps` em `~/.ssh/config`
* **Default System User:** `ubuntu`
* **Private SSH Key:** Gerenciada no host local via `~/.ssh/config` (`petrankings-vps`)
* **Application Directory:** `/home/ubuntu/petrankings/`

---

## 2. Docker Compose Multi-Container Orchestration

The application stack operates 5 isolated containers connected via the bridge network `petrankings-net`:

| Container Name | Image | Internal Port | Exposed Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `petrankings-caddy` | `caddy:2-alpine` | `80` | `80:80` | Reverse proxy, virtual host routing & Cloudflare bridge |
| `petrankings-app` | `petrankings-app:latest` | `3000` | Interno | Next.js 15 Standalone portal (SSR/SSG) |
| `petrankings-postgres` | `postgres:16-alpine` | `5432` | `127.0.0.1:5432` | Master PostgreSQL 16 database (Tuned 12GB RAM) |
| `petrankings-umami` | `umami:postgresql-latest` | `3000` | Interno | Privacy-friendly, cookie-free web analytics |
| `petrankings-uptime` | `louislam/uptime-kuma:2` | `3001` | Interno | 24/7 Service health monitor & uptime dashboard |

### Invariante Crítica de Segurança de Rede
> ⚠️ **REGRA INEGOCIÁVEL:** A porta do PostgreSQL (`5432`) **JAMAIS** deve ser exposta publicamente (`0.0.0.0:5432`). Ela é obrigatoriamente vinculada a `127.0.0.1:5432:5432` no host da VM, acessível externamente **exclusivamente via Túnel Criptografado SSH**.

---

## 3. PostgreSQL 16 Memory Tuning (12 GB RAM Allocation)

O PostgreSQL opera com parâmetros avançados de concorrência e memória no `docker-compose.yml`:

```yaml
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=2GB"             # 2GB dedicados ao cache de páginas na RAM
      - "-c"
      - "effective_cache_size=6GB"       # 6GB para estimativa do otimizador de consultas
      - "-c"
      - "work_mem=16MB"                  # Ordenações rápidas em RAM para rankings e filtros
      - "-c"
      - "maintenance_work_mem=512MB"     # Vácuo e recriação de índices ultrarrápida
      - "-c"
      - "min_wal_size=1GB"
      - "-c"
      - "max_wal_size=4GB"
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=16MB"
      - "-c"
      - "default_statistics_target=100"
      - "-c"
      - "random_page_cost=1.1"           # Calibração para SSD NVMe rápido
      - "-c"
      - "max_worker_processes=2"
      - "-c"
      - "max_parallel_workers_per_gather=1"
      - "-c"
      - "max_parallel_workers=2"
```

---

## 4. Rotinas de Deploy e Manutenção Remota

### A. Deploy Remoto Seguro (Zero Downtime)
Para enviar alterações de código do GitHub para a máquina de produção:

```bash
ssh -i "D:/Projetos/ssh-key-2026-10-03.key" ubuntu@168.138.144.63 "cd ~/petrankings && git pull origin main && docker compose build app && docker compose up -d app"
```

### B. Gestão de Logs e Prevenção de Esgotamento de Disco
Todos os containers usam o bloco âncora `x-logging` limitando logs a 50MB:
```yaml
x-logging: &default-logging
  logging:
    driver: "json-file"
    options:
      max-size: "50m"
      max-file: "3"
```
A máquina possui cronjob semanal aos domingos às 04:00 para expurgo de imagens órfãs:
```bash
0 4 * * 0 /usr/bin/docker image prune -f >> /var/log/docker-prune.log 2>&1
```

---

## 5. Túnel SSH e Operações Locais com o Banco

### Conexão Manual de Desenvolvimento
```powershell
npm run tunel
# Abre túnel na porta local 5433 mapeada para 127.0.0.1:5432 na VM
```

### Ingestão Automatizada de Produtos
O comando abaixo gerencia a abertura do túnel em segundo plano, executa a rotina de cadastro e sincroniza fichas técnicas:
```powershell
npm run cadastrar-produtos
```

---

## 6. Política de Backups e Resgate de Desastre (Regra 3-2-1)

1. **Cópia Quente:** PostgreSQL ativo com volume persistente `postgres_data`.
2. **Cópia Compactada na VM:** Script diário às 03:00 da manhã (`/home/ubuntu/petrankings/scripts/backup-db.sh` -> `/home/ubuntu/backups_postgres/`).
   * *Retenção automática:* Backups com mais de 30 dias são expurgados automaticamente.
3. **Cópia Fria Local:** Puxe o backup mais recente para sua máquina Windows com 1 comando:
   ```powershell
   npm run backup:puxar
   ```
   *(Salvo em `d:/Projetos/PetRankings/_backups_nuvem/petrankings_backup_YYYYMMDD_HHMMSS.sql.gz`).*

### Restauração de Desastre (Disaster Recovery)
Caso seja necessário restaurar um dump no banco:
```bash
# Na VM:
gunzip -c /home/ubuntu/backups_postgres/petrankings_backup_NOME.sql.gz | docker exec -i petrankings-postgres psql -U petrankings -d petrankings
```

---

## 7. Hardening do Sistema Operacional (Segurança de Borda)

* **Fail2ban:** Monitora `/var/log/auth.log` na porta 22. Bloqueia IPs após 5 tentativas maliciosas por 3600 segundos (1 hora).
  * *Verificar status:* `sudo fail2ban-client status sshd`
* **Unattended-Upgrades:** Atualizações de pacotes e patches do kernel Ubuntu instaladas automaticamente via `unattended-upgrades.service`.
* **Permissões do `.env`:** Arquivo `/home/ubuntu/petrankings/.env` com permissão estrita `chmod 600` (leitura apenas por `ubuntu`).
