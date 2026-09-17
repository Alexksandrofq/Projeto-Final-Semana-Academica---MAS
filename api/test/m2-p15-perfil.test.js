process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Pontos 11 (P-15 detalhe: GET :id alheio → 404) e 13 (perfil 403 em cancelamento/confirmação).
// Origem: entrevistas/M2-inscricoes.mc P8/P15; contrato §5 M2 (Quem = participante)
// e §1 ordem 401 → 403 → 404.
describe('M2 — detalhe alheio e perfil participante', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  async function criarMini(app) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas: 20,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  it('P-15: participante vê 404 em GET /inscricoes/:id alheio; organização vê 200', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const alheio = await request(app).get(`/inscricoes/${ins.body.id}`).set('X-Usuario', 'p-joao');
    expect(alheio.status).toBe(404);
    expect(alheio.body.erro).toBe('NAO_ENCONTRADO');
    await request(app).get(`/inscricoes/${ins.body.id}`).set('X-Usuario', 'org-ana').expect(200);
  });

  it('organização recebe 403 SOMENTE_PARTICIPANTE em cancelamento e confirmação', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const canc = await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`).set('X-Usuario', 'org-ana');
    expect(canc.status).toBe(403);
    expect(canc.body.erro).toBe('SOMENTE_PARTICIPANTE');
    const conf = await request(app).post(`/inscricoes/${ins.body.id}/confirmacao`).set('X-Usuario', 'org-bruno');
    expect(conf.status).toBe(403);
    expect(conf.body.erro).toBe('SOMENTE_PARTICIPANTE');
  });

  it('ordem 401 → 403: sem X-Usuario dá 401 mesmo em rota de participante', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini(app);
    const ins = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const sem = await request(app).post(`/inscricoes/${ins.body.id}/cancelamento`);
    expect(sem.status).toBe(401);
    expect(sem.body.erro).toBe('USUARIO_DESCONHECIDO');
  });
});
