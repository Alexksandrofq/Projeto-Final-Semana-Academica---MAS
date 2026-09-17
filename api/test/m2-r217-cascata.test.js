process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 9 (RN-217): convocada→cancelada e expirada inalterada no cancelamento da atividade.
// Origem: entrevistas/M2-inscricoes.mc P17; spec RN-217.
describe('M2-RN-217 — cascata com convocada e expirada', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('convocada vira cancelada; expirada e cancelada permanecem', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas: 1,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    const id = r.body.id;
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const p1 = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const p2 = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const p3 = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    // cancela confirmada → p2 convocada, p3 espera/1
    await request(app).post(`/inscricoes/${p1.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    // expira p2 → p2 expirada, p3 convocada
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T12:01:00-03:00' }).expect(200);
    await request(app).post(`/inscricoes/${p2.body.id}/confirmacao`).set('X-Usuario', 'p-joao').expect(422);
    // p4 entra em espera atrás da convocada p3
    const p4 = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    expect(p4.body.status).toBe('em_espera');

    await request(app).post(`/atividades/${id}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);

    const s1 = await request(app).get(`/inscricoes/${p1.body.id}`).set('X-Usuario', 'p-carla').expect(200);
    const s2 = await request(app).get(`/inscricoes/${p2.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    const s3 = await request(app).get(`/inscricoes/${p3.body.id}`).set('X-Usuario', 'p-diego').expect(200);
    const s4 = await request(app).get(`/inscricoes/${p4.body.id}`).set('X-Usuario', 'p-elisa').expect(200);
    expect(s1.body.status).toBe('cancelada'); // já era cancelada, permanece
    expect(s2.body.status).toBe('expirada'); // inativa permanece inalterada
    expect(s3.body.status).toBe('cancelada'); // convocada → cancelada
    expect(s4.body.status).toBe('cancelada'); // em_espera → cancelada
  });
});
