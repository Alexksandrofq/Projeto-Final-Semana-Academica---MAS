process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 1 (RN-204 expiração em cadeia) + Ponto 7 (RN-212/213 valor absoluto 2h).
// Origem: entrevistas/M2-inscricoes.mc P3 (recomputo após cancelamento ou expiração)
// e P11 (convocadaAte = instante da liberação + 2h); spec specs/M2-inscricoes.md RN-204/RN-212.
describe('M2-RN-204/212 — expiração em cadeia e prazo absoluto de 2h', () => {
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

  it('convocadaAte é o instante da liberação + 2h (valor escrito à mão)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini1Vaga(app);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    expect(b.body.status).toBe('em_espera');
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const conv = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(conv.body.status).toBe('convocada');
    // 10:00-03:00 + 2h = 12:00-03:00 = 15:00Z — valor da spec, não lido do código
    expect(conv.body.convocadaAte).toBe('2026-10-13T15:00:00.000Z');
  });

  it('expiração convoca o próximo em cadeia e recomputa posições (1 vaga, A conf, B/C espera)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criarMini1Vaga(app);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const c = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    expect(b.body.posicaoNaEspera).toBe(1);
    expect(c.body.posicaoNaEspera).toBe(2);

    // cancela A → B convocada (10:00+2h), C passa a posição 1
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const bConv = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(bConv.body.status).toBe('convocada');
    expect(bConv.body.convocadaAte).toBe('2026-10-13T15:00:00.000Z');
    const cEsp = await request(app).get(`/inscricoes/${c.body.id}`).set('X-Usuario', 'p-diego').expect(200);
    expect(cEsp.body.status).toBe('em_espera');
    expect(cEsp.body.posicaoNaEspera).toBe(1);

    // avança além de convocadaAte de B e confirma B → EXPIRADA + C convocada em cadeia
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T12:01:00-03:00' }).expect(200);
    const exp = await request(app).post(`/inscricoes/${b.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(exp.status).toBe(422);
    expect(exp.body.erro).toBe('CONVOCACAO_EXPIRADA');

    const bExp = await request(app).get(`/inscricoes/${b.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    expect(bExp.body.status).toBe('expirada');
    expect(bExp.body.posicaoNaEspera).toBe(null);

    const cConv = await request(app).get(`/inscricoes/${c.body.id}`).set('X-Usuario', 'p-diego').expect(200);
    expect(cConv.body.status).toBe('convocada');
    expect(cConv.body.posicaoNaEspera).toBe(null);
    // 12:01-03:00 + 2h = 14:01-03:00 = 17:01Z
    expect(cConv.body.convocadaAte).toBe('2026-10-13T17:01:00.000Z');
  });
});
