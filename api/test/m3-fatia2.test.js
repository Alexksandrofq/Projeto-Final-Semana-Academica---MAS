process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M3 Fatia 2 — Presença Offline (lidoEm e sincronização tardia)', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('registra presença offline com sucesso (201 Created) quando lidoEm está na janela e sincronizado dentro do prazo de 2h', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Offline',
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
    await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    // Relógio avança para o momento exato do encontro (19:00) para gerar o código válido na hora da leitura offline
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T19:05:00-03:00' })
      .expect(200);

    const resCod = await request(app)
      .get(`/encontros/${encId}/codigo`)
      .set('X-Usuario', 'org-ana')
      .expect(200);

    // Relógio avança para 22:30 (1h30 após o fim 21:00, dentro do prazo de 2h)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T22:30:00-03:00' })
      .expect(200);

    const resPres = await request(app)
      .post(`/encontros/${encId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({
        codigo: resCod.body.codigo,
        lidoEm: '2026-10-19T19:05:00-03:00'
      });

    expect(resPres.status).toBe(201);
    expect(resPres.body.origem).toBe('qr_offline');
    expect(resPres.body.participanteId).toBe('p-carla');
  });

  it('recusa sincronização tardia com 422 SINCRONIZACAO_TARDIA quando lidoEm é sincronizado mais de 2h após o fim', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Tardia',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      });

    const encId = resAtv.body.encontros[0].id;
    const atvId = resAtv.body.id;

    await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T19:05:00-03:00' })
      .expect(200);

    const resCod = await request(app)
      .get(`/encontros/${encId}/codigo`)
      .set('X-Usuario', 'org-ana')
      .expect(200);

    // Relógio avança para 23:05 (2h05 após o fim 21:00, fora do prazo de 2h)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T23:05:00-03:00' })
      .expect(200);

    const resPres = await request(app)
      .post(`/encontros/${encId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({
        codigo: resCod.body.codigo,
        lidoEm: '2026-10-19T19:05:00-03:00'
      });

    expect(resPres.status).toBe(422);
    expect(resPres.body.erro).toBe('SINCRONIZACAO_TARDIA');
  });
});
