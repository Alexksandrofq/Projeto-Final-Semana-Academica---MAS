process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 3 (RN-207): convocada bloqueia; cancelada/expirada não bloqueiam.
// Origem: entrevistas/M2-inscricoes.mc P5; spec RN-207.
describe('M2-RN-207 — convocada conta, cancelada/expirada não contam', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  const ENC_A = [
    { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
    { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
  ];
  const ENC_B = [
    { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }
  ];

  async function criar(app, titulo, salaId, encontros, vagas = 20) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana')
      .send({ titulo, tipo: 'minicurso', salaId, vagas, encontros });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  it('convocada bloqueia inscrição sobreposta com 409 CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const lotada = await criar(app, 'Lotada', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const conf = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const espera = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${conf.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const conv = await request(app).get(`/inscricoes/${espera.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(conv.body.status).toBe('convocada');

    const alvo = await criar(app, 'Alvo', 'sala-102', ENC_B);
    const resp = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('CONFLITO_DE_HORARIO');
  });

  it('cancelada não bloqueia inscrição sobreposta (201)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const a = await criar(app, 'A', 'sala-101', ENC_A);
    const ins = await request(app).post(`/atividades/${a}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const b = await criar(app, 'B', 'sala-102', ENC_B);
    await request(app).post(`/atividades/${b}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
  });

  it('expirada não bloqueia inscrição sobreposta (201)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const lotada = await criar(app, 'Lotada', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const conf = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const espera = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${conf.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T12:01:00-03:00' }).expect(200);
    await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao').expect(422);
    const alvo = await criar(app, 'Alvo', 'sala-102', ENC_B);
    await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
  });
});
