process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 8 (RN-215): CONFLITO/LIMITE na confirmação + precedência + SEM para todos os não-convocados.
// Origem: entrevistas/M2-inscricoes.mc P12/P14; spec RN-215.
describe('M2-RN-215 — confirmação: ramos e precedência', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  const ENC_A = [
    { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
    { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
  ];
  const ENC_SOBREPOSTO = [
    { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }
  ];

  async function criar(app, titulo, salaId, encontros, vagas = 20) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana')
      .send({ titulo, tipo: 'minicurso', salaId, vagas, encontros });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  // B fica em_espera em A (não conta p/ conflito/limite), depois ocupa vaga
  // em D sobrepostoenquanto ainda é espera, aí A convoca B.
  async function prepararConflitoNaConfirmacao(app) {
    const a = await criar(app, 'Alvo A', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const ocupante = await request(app).post(`/atividades/${a}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const espera = await request(app).post(`/atividades/${a}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // ainda em_espera → pode se inscrever na sobreposta D
    const d = await criar(app, 'Conflitante D', 'sala-102', ENC_SOBREPOSTO);
    await request(app).post(`/atividades/${d}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // libera vaga em A → B vira convocada, agora em conflito com D
    await request(app).post(`/inscricoes/${ocupante.body.id}/cancelamento`).set('X-Usuario', 'p-elisa').expect(200);
    return espera.body.id;
  }

  it('confirmar convocada em conflito retorna 409 CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const convId = await prepararConflitoNaConfirmacao(app);
    const resp = await request(app).post(`/inscricoes/${convId}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('CONFLITO_DE_HORARIO');
  });

  it('confirmar convocada no limite retorna 422 LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'auditorio'];
    const mk = async (titulo, i) => criar(app, titulo, salas[i % 3], [
      { inicio: `2026-10-19T${slots[i % 3][0]}-03:00`, fim: `2026-10-19T${slots[i % 3][1]}-03:00` },
      { inicio: `2026-10-20T${slots[i % 3][0]}-03:00`, fim: `2026-10-20T${slots[i % 3][1]}-03:00` },
    ]);
    const alvo = await criar(app, 'Alvo', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const ocup = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const m1 = await mk('M1', 0);
    const m2 = await mk('M2', 1);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // em_espera no alvo (2 confirmadas → permitido)
    const espera = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // 3ª confirmada fora (ainda 2 → permitido)
    const m3 = await mk('M3', 2);
    await request(app).post(`/atividades/${m3}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // convoca no alvo → agora 3 ocupam; confirmar dá LIMITE
    await request(app).post(`/inscricoes/${ocup.body.id}/cancelamento`).set('X-Usuario', 'p-elisa').expect(200);
    const resp = await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('LIMITE_DE_MINICURSOS');
  });

  it('precedência: CONVOCACAO_EXPIRADA precede CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const convId = await prepararConflitoNaConfirmacao(app);
    const conv = await request(app).get(`/inscricoes/${convId}`).set('X-Usuario', 'p-joao').expect(200);
    await request(app).put('/_teste/relogio')
      .send({ agora: new Date(new Date(conv.body.convocadaAte).getTime() + 60 * 1000).toISOString() })
      .expect(200);
    const resp = await request(app).post(`/inscricoes/${convId}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('CONVOCACAO_EXPIRADA');
  });

  it('precedência: CONVOCACAO_EXPIRADA precede LIMITE_DE_MINICURSOS na confirmação', async () => {
    await request(app).post('/_teste/reset').expect(204);
    // convocada expirada de quem já tem 3 minicursos → EXPIRADA, não LIMITE
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'auditorio'];
    const mk = async (titulo, i) => criar(app, titulo, salas[i % 3], [
      { inicio: `2026-10-19T${slots[i % 3][0]}-03:00`, fim: `2026-10-19T${slots[i % 3][1]}-03:00` },
      { inicio: `2026-10-20T${slots[i % 3][0]}-03:00`, fim: `2026-10-20T${slots[i % 3][1]}-03:00` },
    ]);
    const alvo = await criar(app, 'Alvo', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const ocup = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const m1 = await mk('M1', 0);
    const m2 = await mk('M2', 1);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const espera = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const m3 = await mk('M3', 2);
    await request(app).post(`/atividades/${m3}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${ocup.body.id}/cancelamento`).set('X-Usuario', 'p-elisa').expect(200);
    const conv = await request(app).get(`/inscricoes/${espera.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    await request(app).put('/_teste/relogio')
      .send({ agora: new Date(new Date(conv.body.convocadaAte).getTime() + 60 * 1000).toISOString() })
      .expect(200);
    const resp = await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('CONVOCACAO_EXPIRADA');
  });

  it('precedência: SEM_CONVOCACAO precede CONFLITO_DE_HORARIO (em_espera em conflito)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    // monta espera + conflito, mas confirma ANTES da convocação → SEM, não CONFLITO
    const a = await criar(app, 'Alvo A', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    await request(app).post(`/atividades/${a}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const espera = await request(app).post(`/atividades/${a}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    expect(espera.body.status).toBe('em_espera');
    const d = await criar(app, 'Conflitante D', 'sala-102', ENC_SOBREPOSTO);
    await request(app).post(`/atividades/${d}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // ainda em_espera (não convocada) em situação de conflito → SEM primeiro
    const resp = await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('SEM_CONVOCACAO');
  });

  it('precedência: SEM_CONVOCACAO precede LIMITE_DE_MINICURSOS (em_espera no limite)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    // em_espera (não convocada) de quem já tem 3 minicursos → SEM, não LIMITE
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'auditorio'];
    const mk = async (titulo, i) => criar(app, titulo, salas[i % 3], [
      { inicio: `2026-10-19T${slots[i % 3][0]}-03:00`, fim: `2026-10-19T${slots[i % 3][1]}-03:00` },
      { inicio: `2026-10-20T${slots[i % 3][0]}-03:00`, fim: `2026-10-20T${slots[i % 3][1]}-03:00` },
    ]);
    const alvo = await criar(app, 'Alvo', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const m1 = await mk('M1', 0);
    const m2 = await mk('M2', 1);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const espera = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const m3 = await mk('M3', 2);
    await request(app).post(`/atividades/${m3}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    // ainda em_espera, já no limite → SEM primeiro
    const resp = await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('SEM_CONVOCACAO');
  });
  it('precedência: CONFLITO_DE_HORARIO precede LIMITE_DE_MINICURSOS na confirmação', async () => {
    await request(app).post('/_teste/reset').expect(204);
    // B com 2 confirmadas + espera no alvo sobreposto a D; D vira a 3ª confirmada
    // e também o conflito → confirmar alvo dá CONFLITO (não LIMITE).
    const alvo = await criar(app, 'Alvo', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const ocup = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-elisa').expect(201);
    const m1 = await criar(app, 'M1', 'sala-101', [
      { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
      { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' },
    ]);
    const m2 = await criar(app, 'M2', 'sala-102', [
      { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' },
      { inicio: '2026-10-20T11:00:00-03:00', fim: '2026-10-20T13:00:00-03:00' },
    ]);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const espera = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const d = await criar(app, 'D sobreposta', 'auditorio', ENC_SOBREPOSTO);
    await request(app).post(`/atividades/${d}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    await request(app).post(`/inscricoes/${ocup.body.id}/cancelamento`).set('X-Usuario', 'p-elisa').expect(200);
    const resp = await request(app).post(`/inscricoes/${espera.body.id}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('CONFLITO_DE_HORARIO');
  });

  it.each(['em_espera', 'cancelada', 'expirada'])('SEM_CONVOCACAO para status %s', async (alvo) => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criar(app, 'Mini', 'lab-3', ENC_A, 1);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const a = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const b = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    let alvoId = b.body.id;
    if (alvo === 'em_espera') {
      const resp = await request(app).post(`/inscricoes/${alvoId}/confirmacao`).set('X-Usuario', 'p-joao');
      expect(resp.status).toBe(422);
      expect(resp.body.erro).toBe('SEM_CONVOCACAO');
      return;
    }
    if (alvo === 'cancelada') {
      await request(app).post(`/inscricoes/${alvoId}/cancelamento`).set('X-Usuario', 'p-joao').expect(200);
      const resp = await request(app).post(`/inscricoes/${alvoId}/confirmacao`).set('X-Usuario', 'p-joao');
      expect(resp.status).toBe(422);
      expect(resp.body.erro).toBe('SEM_CONVOCACAO');
      return;
    }
    // expirada
    await request(app).post(`/inscricoes/${a.body.id}/cancelamento`).set('X-Usuario', 'p-carla').expect(200);
    const conv = await request(app).get(`/inscricoes/${alvoId}`).set('X-Usuario', 'p-joao').expect(200);
    await request(app).put('/_teste/relogio')
      .send({ agora: new Date(new Date(conv.body.convocadaAte).getTime() + 60 * 1000).toISOString() })
      .expect(200);
    await request(app).post(`/inscricoes/${alvoId}/confirmacao`).set('X-Usuario', 'p-joao').expect(422);
    const resp2 = await request(app).post(`/inscricoes/${alvoId}/confirmacao`).set('X-Usuario', 'p-joao');
    expect(resp2.status).toBe(422);
    expect(resp2.body.erro).toBe('SEM_CONVOCACAO');
  });
});
