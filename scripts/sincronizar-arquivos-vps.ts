import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  console.log('================================================================');
  console.log('🚀 SINCRONIZADOR DE UPLOADS E CUSTÓDIA COM A ORACLE VPS');
  console.log('================================================================\n');

  const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';

  // 1. Sincronizar imagens de public/uploads/
  console.log('📦 [1/2] Verificando imagens em public/uploads/...');
  const localUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const localUploadFiles = fs
    .readdirSync(localUploadsDir)
    .filter((f) => fs.statSync(path.join(localUploadsDir, f)).isFile());

  console.log(`   Locais: ${localUploadFiles.length} arquivos.`);

  // Pede lista de arquivos remotos
  const remoteUploadsRaw = execSync(`ssh ${sshTarget} "ls -1 /home/ubuntu/petrankings/public/uploads"`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const remoteUploadSet = new Set(remoteUploadsRaw.split('\n').map((f) => f.trim()).filter(Boolean));
  console.log(`   Remotos: ${remoteUploadSet.size} arquivos.`);

  const missingUploads = localUploadFiles.filter((f) => !remoteUploadSet.has(f));
  console.log(`   Pendentes de envio: ${missingUploads.length} arquivos.`);

  if (missingUploads.length > 0) {
    console.log(`\n🚀 Enviando ${missingUploads.length} imagens para /home/ubuntu/petrankings/public/uploads/...`);
    // Envia em lotes de 40 para não estourar tamanho da linha de comando
    const batchSize = 40;
    for (let i = 0; i < missingUploads.length; i += batchSize) {
      const slice = missingUploads.slice(i, i + batchSize);
      const quoted = slice.map((f) => `"${path.join(localUploadsDir, f).replace(/\\/g, '/')}"`).join(' ');
      console.log(`   Enviando lote [${i + 1} a ${Math.min(i + batchSize, missingUploads.length)}]...`);
      execSync(`scp ${quoted} ${sshTarget}:/home/ubuntu/petrankings/public/uploads/`, { stdio: 'inherit' });
    }
    console.log('   ✓ Todas as imagens foram sincronizadas!');
  } else {
    console.log('   ✓ Todas as imagens já estão presentes no servidor!');
  }

  // 2. Sincronizar arquivos de custódia HTML
  console.log('\n📄 [2/2] Verificando arquivos em public/uploads/custodia/...');
  const localCustodiaDir = path.join(process.cwd(), 'public', 'uploads', 'custodia');
  const localCustodiaFiles = fs
    .readdirSync(localCustodiaDir)
    .filter((f) => fs.statSync(path.join(localCustodiaDir, f)).isFile());

  console.log(`   Locais: ${localCustodiaFiles.length} arquivos.`);

  // Garante que o diretório remoto de custódia exista
  execSync(`ssh ${sshTarget} "mkdir -p /home/ubuntu/petrankings/public/uploads/custodia"`);

  const remoteCustodiaRaw = execSync(`ssh ${sshTarget} "ls -1 /home/ubuntu/petrankings/public/uploads/custodia"`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const remoteCustodiaSet = new Set(remoteCustodiaRaw.split('\n').map((f) => f.trim()).filter(Boolean));
  console.log(`   Remotos: ${remoteCustodiaSet.size} arquivos.`);

  const missingCustodia = localCustodiaFiles.filter((f) => !remoteCustodiaSet.has(f));
  console.log(`   Pendentes de envio: ${missingCustodia.length} arquivos.`);

  if (missingCustodia.length > 0) {
    console.log(`\n🚀 Enviando ${missingCustodia.length} arquivos de custódia para /home/ubuntu/petrankings/public/uploads/custodia/...`);
    const batchSize = 40;
    for (let i = 0; i < missingCustodia.length; i += batchSize) {
      const slice = missingCustodia.slice(i, i + batchSize);
      const quoted = slice.map((f) => `"${path.join(localCustodiaDir, f).replace(/\\/g, '/')}"`).join(' ');
      console.log(`   Enviando lote [${i + 1} a ${Math.min(i + batchSize, missingCustodia.length)}]...`);
      execSync(`scp ${quoted} ${sshTarget}:/home/ubuntu/petrankings/public/uploads/custodia/`, { stdio: 'inherit' });
    }
    console.log('   ✓ Todos os arquivos de custódia foram sincronizados!');
  } else {
    console.log('   ✓ Todos os arquivos de custódia já estão presentes no servidor!');
  }

  // 3. Verificação final de contagem
  console.log('\n================================================================');
  console.log('🏁 CONFERÊNCIA FINAL NO SERVIDOR REMOTO:');
  const finalUploadsCount = execSync(`ssh ${sshTarget} "ls -1 /home/ubuntu/petrankings/public/uploads | wc -l"`, { encoding: 'utf-8' }).trim();
  const finalCustodiaCount = execSync(`ssh ${sshTarget} "ls -1 /home/ubuntu/petrankings/public/uploads/custodia | wc -l"`, { encoding: 'utf-8' }).trim();
  console.log(`   📁 Total de arquivos em public/uploads/ no servidor: ${finalUploadsCount}`);
  console.log(`   📁 Total de arquivos em public/uploads/custodia/ no servidor: ${finalCustodiaCount}`);
  console.log('================================================================\n');
}

main().catch(console.error);

