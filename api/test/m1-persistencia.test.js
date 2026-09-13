process.env.MODO_TESTE = '1';

const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { criarServidor } = require('../src/app');

const palestraValida = {
  titulo: 'Palestra persistente',
  tipo: 'palestra',
  salaId: 'sala-101',
  vagas: 20,
  encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
};

describe('persistência em arquivo SQLite', () => {
  let arquivo;

  beforeAll(() => {
    arquivo = path.join(
      os.tmpdir(),
      `semana-academica-m1-persistencia-${process.pid}-${Date.now()}.db`
    );
  });

  afterAll(() => {
    for (const nome of [arquivo, `${arquivo}-wal`, `${arquivo}-shm`]) {
      try {
        fs.unlinkSync(nome);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
  });

  it('atividade criada sobrevive ao fechar e reabrir o mesmo arquivo de banco', async () => {
    const app1 = criarServidor({ arquivoBanco: arquivo });

    const criacao = await request(app1)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida);
    expect(criacao.status).toBe(201);
    const id = criacao.body.id;

    app1.locals.banco.fechar();

    const app2 = criarServidor({ arquivoBanco: arquivo });
    try {
      const lista = await request(app2).get('/atividades').set('X-Usuario', 'p-carla');

      expect(lista.status).toBe(200);
      const encontrada = lista.body.find((a) => a.id === id);
      expect(encontrada).toBeDefined();
      expect(encontrada.titulo).toBe('Palestra persistente');
    } finally {
      app2.locals.banco.fechar();
    }
  });
});