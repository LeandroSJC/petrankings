import { spawn, execSync } from 'child_process';
import net from 'net';

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
  const args = process.argv.slice(2).join(' ');
  console.log('🚀 [PetRankings] Iniciando fluxo de recálculo com túnel seguro...\n');

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('📡 [Túnel SSH] Porta 5433 já está ativa. Utilizando conexão existente.');
  } else {
    console.log('🔒 [Túnel SSH] Abrindo túnel seguro em segundo plano com a Oracle Cloud...');
    const keyPath = 'D:/Projetos/ssh-key-2026-10-03.key';
    tunnelProcess = spawn('ssh', [
      '-i', keyPath,
      '-L', '5433:127.0.0.1:5432',
      '-N',
      'ubuntu@168.138.144.63'
    ], { stdio: 'ignore', windowsHide: true });

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
    console.log(`🐾 [Recálculo] Executando correção de Cálcio e recalculando scores...`);
    execSync(`npx tsx --env-file=.env scripts/recalcular-calcio-produtos.ts ${args}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('🎉 [Sucesso] Recálculo finalizado com sucesso!');
  } catch (err: any) {
    console.error('\n❌ Erro durante o recálculo:', err.message);
  } finally {
    if (tunnelProcess) {
      console.log('🔌 [Túnel SSH] Fechando conexão segura temporária.');
      tunnelProcess.kill();
    }
  }
}

run();
