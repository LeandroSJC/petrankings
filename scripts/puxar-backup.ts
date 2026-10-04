import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ==============================================================================
// PetRankings — Download Automático do Backup PostgreSQL da Nuvem para o Local
// ==============================================================================

const SSH_KEY = 'D:/Projetos/ssh-key-2026-10-03.key';
const SERVER = 'ubuntu@168.138.144.63';
const REMOTE_DIR = '/home/ubuntu/backups_postgres';
const LOCAL_DIR = path.join(process.cwd(), '_backups_nuvem');

async function main() {
  console.log('📦 [PetRankings] Consultando backups mais recentes na Oracle Cloud...\n');

  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }

  // 1. Identifica o arquivo mais recente no servidor
  let latestFile = '';
  try {
    const listCmd = `ssh -i "${SSH_KEY}" ${SERVER} "ls -1t ${REMOTE_DIR}/petrankings_backup_*.sql.gz 2>/dev/null | head -n 1"`;
    latestFile = execSync(listCmd, { encoding: 'utf-8' }).trim();
  } catch (err: any) {
    console.error('❌ Erro ao listar backups remotos via SSH:', err.message);
    process.exit(1);
  }

  if (!latestFile) {
    console.log('⚠️ Nenhum arquivo de backup encontrado no servidor. Criando um backup agora...');
    try {
      execSync(`ssh -i "${SSH_KEY}" ${SERVER} "~/petrankings/scripts/backup-db.sh"`, { stdio: 'inherit' });
      const listCmd = `ssh -i "${SSH_KEY}" ${SERVER} "ls -1t ${REMOTE_DIR}/petrankings_backup_*.sql.gz 2>/dev/null | head -n 1"`;
      latestFile = execSync(listCmd, { encoding: 'utf-8' }).trim();
    } catch (err: any) {
      console.error('❌ Erro ao disparar backup remoto:', err.message);
      process.exit(1);
    }
  }

  const filename = path.basename(latestFile);
  const localDest = path.join(LOCAL_DIR, filename);

  console.log(`📡 Backup mais recente na nuvem: ${filename}`);
  console.log(`⬇️ Baixando com segurança via SCP para: ${localDest} ...\n`);

  try {
    const scpCmd = `scp -i "${SSH_KEY}" ${SERVER}:"${latestFile}" "${localDest}"`;
    execSync(scpCmd, { stdio: 'inherit' });

    const stats = fs.statSync(localDest);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Download concluído com sucesso!`);
    console.log(`📁 Arquivo salvo em: ${localDest}`);
    console.log(`📊 Tamanho compactado: ${sizeMb} MB`);
    console.log(`💡 Regra 3-2-1 de backups atendida com sucesso.`);
  } catch (err: any) {
    console.error('❌ Erro ao transferir arquivo com SCP:', err.message);
    process.exit(1);
  }
}

main();
