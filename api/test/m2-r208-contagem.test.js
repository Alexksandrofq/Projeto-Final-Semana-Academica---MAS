process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 4 (RN-208): em_espera não conta, convocada conta, palestra não entra.
// Origem: entrevistas/M2-inscricoes.mc P6; spec RN-208.
describe('M2-RN-208 — contagem do limite de 3 minicursos', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  const SLOTS = [
    ['08:00:00', '10:00:00'],
    ['11:00:00', '13:00:00'],
    ['14:00:00', '16:00:00'],
    ['17:00:00', '18:00:00'],
    ['18:30:00', '19:30:00'],
  ];
  const SALAS = ['sala-101', 'sala-102', 'lab-3', 'auditorio', 'sala-101'];

  async function criarMini(app, titulo, i, vagas = 20) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo, tipo: 'minicurso', salaId: SALAS[i % SALAS.length], vagas,
      encontros: [
        { inicio: `2026-10-19T${SLOTS[i][0]}-03:00`, fim: `2026-10-19T${SLOTS[i][1]}-03:00` },
        { inicio: `2026-10-20T${SLOTS[i][0]}-03:00`, fim: `2026-10-20T${SLOTS[i][1]}-03:00` },
      ]
    });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  async function criarPalestra(app, titulo, i) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo, tipo: 'palestra', salaId: SALAS[i % SALAS.length], vagas: 20,
      encontros: [
        { inicio: `2026-10-2${1 + (i % 3)}T${SLOTS[i][0]}-03:00`, fim: `2026-10-2${1 + (i % 3)}T${SLOTS[i][1]}-03:00` },
      ]
    });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  it('em_espera não conta para o limite (2 confirmadas + 1 espera → 3ª confirmada passa)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const lotada = await criarMini(app, 'Lotada', 0, 1);
    await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    const espera = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    expect(espera.body.status).toBe('em_espera');

    const m1 = await criarMini(app, 'M1', 1);
    const m2 = await criarMini(app, 'M2', 2);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    // só 2 ocupam vaga → 3ª confirmada ainda permitida
    const m3 = await criarMini(app, 'M3', 3);
    await request(app).post(`/atividades/${m3}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    // agora 3 ocupam → 4ª bloqueia
    const m4 = await criarMini(app, 'M4', 4);
    const resp = await request(app).post(`/atividades/${m4}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('LIMITE_DE_MINICURSOS');
  });

  it('convocada conta para o limite (2 confirmadas + 1 convocada → próxima bloqueia)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' }).expect(200);
    const lotada = await criarMini(app, 'Lotada', 0, 1);
    const conf = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    const espera = await request(app).post(`/atividades/${lotada}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/inscricoes/${conf.body.id}/cancelamento`).set('X-Usuario', 'p-diego').expect(200);
    const conv = await request(app).get(`/inscricoes/${espera.body.id}`).set('X-Usuario', 'p-carla').expect(200);
    expect(conv.body.status).toBe('convocada');

    const m1 = await criarMini(app, 'M1', 1);
    const m2 = await criarMini(app, 'M2', 2);
    await request(app).post(`/atividades/${m1}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/atividades/${m2}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    // 2 confirmadas + 1 convocada = 3 → próxima dá LIMITE
    const m3 = await criarMini(app, 'M3', 3);
    const resp = await request(app).post(`/atividades/${m3}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('LIMITE_DE_MINICURSOS');
  });

  it('palestra não entra no limite (3 palestras + 3 minicursos passam; 4º minicurso bloqueia)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    for (let i = 0; i < 3; i++) {
      const p = await criarPalestra(app, `P${i}`, i);
      await request(app).post(`/atividades/${p}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    const ids = [];
    for (let i = 0; i < 3; i++) {
      ids.push(await criarMini(app, `M${i}`, i));
    }
    for (const id of ids) {
      await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    const m4 = await criarMini(app, 'M4', 4);
    const resp = await request(app).post(`/atividades/${m4}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('LIMITE_DE_MINICURSOS');
  });
});
