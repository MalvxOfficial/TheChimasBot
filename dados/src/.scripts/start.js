#!/usr/bin/env node

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import readline from 'readline/promises';
import os from 'os';

const CONFIG_PATH = path.join(process.cwd(), 'dados', 'src', 'config.json');
const NODE_MODULES_PATH = path.join(process.cwd(), 'node_modules');
const CONNECT_FILE = path.join(process.cwd(), 'dados', 'src', 'connect.js');
const isWindows = os.platform() === 'win32';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[1;32m',
  red: '\x1b[1;31m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  bold: '\x1b[1m',
};

const mensagem = (text) => console.log(`${colors.green}${text}${colors.reset}`);
const aviso = (text) => console.log(`${colors.red}${text}${colors.reset}`);
const info = (text) => console.log(`${colors.cyan}${text}${colors.reset}`);
const separador = () => console.log(`${colors.blue}============================================${colors.reset}`);

const getVersion = () => {
  try {
    const packageJson = JSON.parse(fsSync.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    return packageJson.version || 'Desconhecida';
  } catch {
    return 'Desconhecida';
  }
};

let botProcess = null;
const version = getVersion();

function setupGracefulShutdown() {
  const shutdown = () => {
    mensagem('🛑 Encerrando o TheChimasBot... Até logo!');
    if (botProcess) {
      botProcess.removeAllListeners();
      botProcess.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (isWindows) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on('SIGINT', shutdown);
  }
}

async function displayHeader() {
  const header = [
    `${colors.bold}🚀 TheChimasBot - Conexão WhatsApp${colors.reset}`,
    `${colors.bold}📦 Versão: ${version}${colors.reset}`,
  ];

  separador();
  for (const line of header) {
    console.log(line);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  separador();
  console.log();
}

async function checkPrerequisites() {
  if (!fsSync.existsSync(CONFIG_PATH)) {
    aviso('⚠️ Arquivo de configuração (config.json) não encontrado! Iniciando configuração automática...');
    try {
      await new Promise((resolve, reject) => {
        const configProcess = spawn('npm', ['run', 'config'], { stdio: 'inherit', shell: isWindows });
        configProcess.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Configuração falhou com código ${code}`))));
        configProcess.on('error', reject);
      });
      mensagem('📝 Configuração concluída com sucesso!');
    } catch (error) {
      aviso(`❌ Falha na configuração: ${error.message}`);
      mensagem('📝 Tente executar manualmente: npm run config');
      process.exit(1);
    }
  }

  if (!fsSync.existsSync(NODE_MODULES_PATH)) {
    aviso('⚠️ Módulos do Node.js não encontrados! Iniciando instalação automática...');
    try {
      await new Promise((resolve, reject) => {
        const installProcess = spawn('npm', ['run', 'config:install'], { stdio: 'inherit', shell: isWindows });
        installProcess.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Instalação falhou com código ${code}`))));
        installProcess.on('error', reject);
      });
      mensagem('📦 Instalação dos módulos concluída com sucesso!');
    } catch (error) {
      aviso(`❌ Falha na instalação dos módulos: ${error.message}`);
      mensagem('📦 Tente executar manualmente: npm run config:install');
      process.exit(1);
    }
  }

  if (!fsSync.existsSync(CONNECT_FILE)) {
    aviso(`⚠️ Arquivo de conexão (${CONNECT_FILE}) não encontrado!`);
    aviso('🔍 Verifique a instalação do projeto.');
    process.exit(1);
  }
}

function startBot() {
  const args = ['--expose-gc', CONNECT_FILE, '--code'];

  info('🔑 Iniciando conexão via Código de Pareamento...');

  botProcess = spawn('node', args, {
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  botProcess.on('error', (error) => {
    aviso(`❌ Erro ao iniciar o processo do bot: ${error.message}`);
    restartBot();
  });

  botProcess.on('close', (code) => {
    if (code === 0) {
      info(`✅ O bot terminou normalmente (código: ${code}). Reiniciando...`);
    } else {
      aviso(`⚠️ O bot terminou com erro (código: ${code}). Reiniciando...`);
    }
    restartBot();
  });

  return botProcess;
}

function restartBot() {
  aviso('🔄 Reiniciando o bot em 500ms...');
  setTimeout(() => {
    if (botProcess) botProcess.removeAllListeners();
    startBot();
  }, 500);
}

async function main() {
  try {
    setupGracefulShutdown();
    await displayHeader();
    await checkPrerequisites();

    // Inicia diretamente por código de pareamento
    startBot();
  } catch (error) {
    aviso(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

(async () => {
  await main();
})();
