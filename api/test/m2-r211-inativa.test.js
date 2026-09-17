process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 6 (RN-211): expirada→INATIVA + cancelamento de espera/convocada com cadeia.
// Origem: entrevistas/M2-inscricoes.mc P9; spec RN-211.
describe('M2-RN-211 — inativa expirada e cancelamento na fila', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  async function criarMini1Vaga(app) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini 1 vaga', tipo: 'minicurso', salaId: 'lab-3', vagas: 1,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  it('cancelar expirada retorna 422 INSCRICAO_INATIVA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini1Vaga(app);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T12:01:00-03:00' }).expect(200);
    await request(app).post(`/inscricoes/${b.body.id}/confirmacao`).set('X-Usuario', 'p-joao').expect(422);
    const resp = await request(app).post(`/inscricoes/${b.body.id}/cancelamento`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('INSCRICAO_INATIVA');
  });

  it('cancelar em_espera da 2ª posição não convoca ninguém e recomputa', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini1Vaga(app);
    await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const c = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    await request(app).post(`/inscricoes/${c.body.id}/cancelamento`).set('X-Usuario', 'p-diego').expect(200);
    const bAtual = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(bAtual.body.status).toBe('em_espera');
    expect(bAtual.body.posicaoNaEspera).toBe(1);
  });

  it('cancelar convocada convoca a próxima da espera', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini1Vaga(app);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const c = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    // B convocada desiste → C deve ser convocada
    await request(app).post(`/inscricoes/${b.body.id}/cancelamento`).set('X-Usuario', 'p-joao').expect(200);
    const cAtual = await request(app).get(`/inscricoes/${c.body.id}`).set('X-Usuario', 'p-diego').expect(200);
    expect(cAtual.body.status).toBe('convocada');
    expect(cAtual.body.posicaoNaEspera).toBe(null);
  });
});
