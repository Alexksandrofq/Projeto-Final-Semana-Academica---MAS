process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M3 Fatia 1 — Presença Online e Código', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa obter código fora da janela com 422 FORA_DA_JANELA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T18:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Teste',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      });

    const encId = resAtv.body.encontros[0].id;

    const res = await request(app)
      .get(`/encontros/${encId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('FORA_DA_JANELA');
  });

  it('registra presença online com sucesso (201 Created)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Teste Online',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      });

    const encId = resAtv.body.encontros[0].id;
    const atvId = resAtv.body.id;

    // Carla se inscreve
    const resIns = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    // Avança relógio para dentro da janela de presença (18:50)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T18:50:00-03:00' })
      .expect(200);

    // Organização pega o código
    const resCod = await request(app)
      .get(`/encontros/${encId}/codigo`)
      .set('X-Usuario', 'org-ana')
      .expect(200);

    // Carla registra presença
    const resPres = await request(app)
      .post(`/encontros/${encId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo: resCod.body.codigo });

    expect(resPres.status).toBe(201);
    expect(resPres.body.origem).toBe('qr');
    expect(resPres.body.participanteId).toBe('p-carla');
    expect(resPres.body.encontroId).toBe(encId);
  });
});
