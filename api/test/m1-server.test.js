process.env.MODO_TESTE = '1';

const { spawn } = require('child_process');
const path = require('path');
const request = require('supertest');

jest.setTimeout(20000);

describe('npm start — servidor real', () => {
  let processo;
  let stdout = '';
  let porta;

  beforeAll(async () => {
    porta = 3200 + Math.floor(Math.random() * 500);
    processo = spawn(process.execPath, ['src/server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, MODO_TESTE: '1', PORT: String(porta) },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    processo.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    processo.stderr.on('data', (d) => {
      stdout += d.toString();
    });

    const inicio = Date.now();
    while (!/ouvindo na porta (\d+)/.test(stdout)) {
      if (Date.now() - inicio > 10000) {
        throw new Error(`servidor não subiu em 10s: ${stdout}`);
      }
      if (processo.exitCode !== null) {
        throw new Error(`processo terminou antes de subir: ${stdout}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  });

  afterAll(() => {
    if (processo) {
      processo.kill();
    }
  });

  it('escutando em PORT definida e respondendo em GET /salas', async () => {
    const portaDeFato = Number(stdout.match(/ouvindo na porta (\d+)/)[1]);
    expect(portaDeFato).toBe(porta);

    const resposta = await request(`http://127.0.0.1:${porta}`).get('/salas');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(4);
  });
});