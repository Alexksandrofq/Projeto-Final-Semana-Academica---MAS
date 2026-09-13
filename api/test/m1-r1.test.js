process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M1-R1 — palestra deve ter exatamente 1 encontro', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa palestra com 2 encontros com 422 QUANTIDADE_DE_ENCONTROS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra com dois encontros',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T20:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T20:00:00-03:00' }
        ]
      });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
  });

  it('recusa palestra com 0 encontros com 422 QUANTIDADE_DE_ENCONTROS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra sem encontros',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: []
      });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
  });
});