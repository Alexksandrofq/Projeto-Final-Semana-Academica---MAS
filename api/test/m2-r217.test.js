process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-217 — Cancelamento de Atividade em cascata', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('ao cancelar atividade, ativas viram cancelada e inativas permanecem', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas: 1,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    const id = r.body.id;
    const insA = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const insB = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    expect(insB.body.status).toBe('em_espera');
    // cria inativa: p-diego inscreve em outra atividade e cancela? mais simples: inscreve terceira em espera e cancela
    const insC = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-diego').expect(201);
    await request(app).post(`/inscricoes/${insC.body.id}/cancelamento`).set('X-Usuario', 'p-diego').expect(200);

    await request(app).post(`/atividades/${id}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);

    const a = await request(app).get(`/inscricoes/${insA.body.id}`).set('X-Usuario', 'p-carla').expect(200);
    const b = await request(app).get(`/inscricoes/${insB.body.id}`).set('X-Usuario', 'p-joao').expect(200);
    const c = await request(app).get(`/inscricoes/${insC.body.id}`).set('X-Usuario', 'p-diego').expect(200);
    expect(a.body.status).toBe('cancelada');
    expect(b.body.status).toBe('cancelada');
    expect(c.body.status).toBe('cancelada'); // já era cancelada, permanece
  });
});
