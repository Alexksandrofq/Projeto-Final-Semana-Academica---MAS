process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

async function criarMini(app, titulo = 'Mini') {
  const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
    titulo, tipo: 'minicurso', salaId: 'lab-3', vagas: 20,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]
  });
  return r.body.id;
}

describe('M2-RN-211 — Cancelamento', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('outro participante recebe 404 NAO_ENCONTRADO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const resp = await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(404);
    expect(resp.body.erro).toBe('NAO_ENCONTRADO');
  });

  it('cancelar inativa retorna 422 INSCRICAO_INATIVA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const resp = await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('INSCRICAO_INATIVA');
  });

  it('cancelar após início retorna 422 ATIVIDADE_JA_INICIADA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T19:00:00-03:00' });
    const resp = await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('ATIVIDADE_JA_INICIADA');
  });
});
