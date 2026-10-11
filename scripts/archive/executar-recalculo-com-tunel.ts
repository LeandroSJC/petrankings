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
  console.log('ðŸš€ [PetRankings] Iniciando fluxo de recÃ¡lculo com tÃºnel seguro...\n');

  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('ðŸ“¡ [TÃºnel SSH] Porta 5433 jÃ¡ estÃ¡ ativa. Utilizando conexÃ£o existente.');
  } else {
    console.log('ðŸ”’ [TÃºnel SSH] Abrindo tÃºnel seguro em segundo plano com a Oracle Cloud...');
    const keyPath = 'caminho/para/chave.key';
    tunnelProcess = spawn('ssh', [
      '-i', keyPath,
      '-L', '5433:127.0.0.1:5432',
      '-N',
      'ubuntu@petrankings-vps'
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
      console.error('âŒ Falha ao estabelecer o tÃºnel SSH com a Oracle Cloud.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('âœ“ [TÃºnel SSH] ConexÃ£o segura estabelecida com sucesso na porta 5433!\n');
  }

  try {
    console.log(`ðŸ¾ [RecÃ¡lculo] Executando correÃ§Ã£o de CÃ¡lcio e recalculando scores...`);
    execSync(`npx tsx --env-file=.env scripts/recalcular-calcio-produtos.ts ${args}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('ðŸŽ‰ [Sucesso] RecÃ¡lculo finalizado com sucesso!');
  } catch (err: any) {
    console.error('\nâŒ Erro durante o recÃ¡lculo:', err.message);
  } finally {
    if (tunnelProcess) {
      console.log('ðŸ”Œ [TÃºnel SSH] Fechando conexÃ£o segura temporÃ¡ria.');
      tunnelProcess.kill();
    }
  }
}

run();
