process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 2 (RN-206): cancelada/expirada permitem nova inscrição.
// Origem: entrevistas/M2-inscricoes.mc P4; spec RN-206.
describe('M2-RN-206 — reinscrição após inativa', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  async function criarMini(app, vagas = 20) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  it('reinscreve com 201 após cancelar a inscrição anterior', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const nova = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    expect(nova.body.status).toBe('confirmada');
  });

  it('reinscreve com 201 após a inscrição expirar', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const conv = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(conv.body.status).toBe('convocada');
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T12:01:00-03:00' }).expect(200);
    await request(app).post(`/inscricoes/${b.body.id}/confirmacao`).set('X-Usuario', 'p-joao').expect(422);
    const exp = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(exp.body.status).toBe('expirada');
    const nova = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    expect(nova.body.status).toBe('confirmada');
  });
});
