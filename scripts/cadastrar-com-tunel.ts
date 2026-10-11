import { spawn, execSync } from 'child_process';
import net from 'net';
import path from 'path';

// Verifica se a porta local 5433 já está aberta
function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('🚀 [PetRankings] Iniciando fluxo de cadastro 100% automatizado...\n');

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('📡 [Túnel SSH] Porta 5433 já está ativa. Utilizando conexão existente.');
  } else {
    console.log('🔒 [Túnel SSH] Abrindo túnel seguro em segundo plano com a Oracle Cloud...');
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    tunnelProcess = spawn('ssh', [
      '-L', '5433:127.0.0.1:5432',
      '-N',
      sshTarget
    ], { stdio: 'ignore', windowsHide: true });

    // Aguarda até o túnel estar pronto
    let ready = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (await isPortOpen(5433)) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.error('❌ Falha ao estabelecer o túnel SSH com a Oracle Cloud.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('✓ [Túnel SSH] Conexão segura estabelecida com sucesso na porta 5433!\n');
  }

  try {
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    // 1. Executa o script de cadastro de produtos
    console.log('🐾 [Cadastro] Executando análise de rótulos e cadastro...');
    execSync('npx tsx --env-file=.env scripts/cadastrar-produtos.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // 2. Sincroniza arquivos gerados (fichas HTML) com o GitHub e a Oracle
    console.log('\n📤 [Sincronização] Verificando se há novas fichas técnicas para enviar...');
    const status = execSync('git status --porcelain public/uploads', { encoding: 'utf-8' });
    
    if (status.trim().length > 0) {
      console.log('📦 Enviando novas fichas técnicas para o GitHub...');
      execSync('git add public/uploads', { stdio: 'inherit' });
      execSync('git commit -m "feat(produtos): fichas tecnicas oficiais geradas automaticamente"', { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });

      console.log('🔄 Atualizando arquivos no servidor da Oracle Cloud...');
      execSync(`ssh ${sshTarget} "cd ~/petrankings && git pull"`, { stdio: 'inherit' });
      console.log('✓ [Sincronização] Servidor da Oracle 100% atualizado com as novas fichas!\n');
    } else {
      console.log('ℹ️ Nenhuma nova ficha pendente de envio.');
    }

    console.log('🎉 [Sucesso] Processo concluído de ponta a ponta!');
  } catch (err: any) {
    console.error('\n❌ Erro durante o fluxo de cadastro:', err.message);
  } finally {
    if (tunnelProcess) {
      console.log('🔌 [Túnel SSH] Fechando conexão segura temporária.');
      tunnelProcess.kill();
    }
  }
}

run();
