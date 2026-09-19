process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M3 Fatia 3 — Presença Manual e Listagem', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('registra presença manual com sucesso (201 Created) pela organização com justificativa válida', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Manual',
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

    // Ajusta relógio para dentro da janela de presença manual (19:05)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T19:05:00-03:00' })
      .expect(200);

    // Organização registra presença manual dentro da janela
    const resPres = await request(app)
      .post(`/encontros/${encId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Participante estava sem bateria no celular.'
      });

    expect(resPres.status).toBe(201);
    expect(resPres.body.origem).toBe('manual');
    expect(resPres.body.participanteId).toBe('p-carla');
    expect(resPres.body.justificativa).toBe('Participante estava sem bateria no celular.');
  });

  it('recusa presença manual sem justificativa ou < 10 chars com 422 JUSTIFICATIVA_OBRIGATORIA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Manual 2',
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

    const resPres = await request(app)
      .post(`/encontros/${encId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Curto'
      });

    expect(resPres.status).toBe(422);
    expect(resPres.body.erro).toBe('JUSTIFICATIVA_OBRIGATORIA');
  });

  it('lista presenças do encontro com sucesso (200 OK) para a organização', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' })
      .expect(200);

    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Listagem',
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

    await request(app)
      .post(`/encontros/${encId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Participante esqueceu crachá.'
      })
      .expect(201);

    const resList = await request(app)
      .get(`/encontros/${encId}/presencas`)
      .set('X-Usuario', 'org-ana');

    expect(resList.status).toBe(200);
    expect(Array.isArray(resList.body)).toBe(true);
    expect(resList.body.length).toBe(1);
    expect(resList.body[0].participanteId).toBe('p-carla');
  });
});
