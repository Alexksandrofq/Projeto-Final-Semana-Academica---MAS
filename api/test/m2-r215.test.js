process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

async function criarMini(app, titulo, salaId, encontros) {
  const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
    titulo, tipo: 'minicurso', salaId, vagas: 1, encontros
  });
  return r.body.id;
}

async function obterConvocada(app, atividadeId, dono = 'p-carla', espera = 'p-joao') {
  const d = await request(app).post(`/atividades/${atividadeId}/inscricoes`).set('X-Usuario', dono).expect(201);
  const e = await request(app).post(`/atividades/${atividadeId}/inscricoes`).set('X-Usuario', espera).expect(201);
  expect(e.body.status).toBe('em_espera');
  await request(app).post(`/inscricoes/${d.body.id}/cancelamento`).set('X-Usuario', dono).expect(200);
  const atual = await request(app).get(`/inscricoes/${e.body.id}`).set('X-Usuario', espera).expect(200);
  return atual.body;
}

describe('M2-RN-215 — Confirmação', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('confirma convocada dentro do prazo vira confirmada', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app, 'Mini', 'lab-3', [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]);
    const conv = await obterConvocada(app, id);
    expect(conv.status).toBe('convocada');
    const resp = await request(app).post(`/inscricoes/${conv.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(200);
    expect(resp.body.status).toBe('confirmada');
  });

  it('confirmar não-convocada retorna 422 SEM_CONVOCACAO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app, 'Mini', 'lab-3', [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const resp = await request(app).post(`/inscricoes/${ins.body.id}/confirmacao`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('SEM_CONVOCACAO');
  });

  it('confirmar após convocadaAte retorna 422 CONVOCACAO_EXPIRADA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app, 'Mini', 'lab-3', [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]);
    const conv = await obterConvocada(app, id);
    await request(app).put('/_teste/relogio').send({ agora: new Date(new Date(conv.convocadaAte).getTime() + 60 * 1000).toISOString() });
    const resp = await request(app).post(`/inscricoes/${conv.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('CONVOCACAO_EXPIRADA');
  });
});
