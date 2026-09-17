process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-208 — Limite de Minicursos', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('recusa 4º minicurso com 422 LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const salas = ['sala-101', 'sala-102', 'lab-3', 'auditorio'];
    const slots = [
      ['08:00:00', '10:00:00'],
      ['11:00:00', '13:00:00'],
      ['14:00:00', '16:00:00'],
      ['17:00:00', '18:00:00'],
    ];
    const ids = [];
    for (let i = 0; i < 4; i++) {
      const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
        titulo: `Mini ${i}`, tipo: 'minicurso', salaId: salas[i], vagas: 20,
        encontros: [
          { inicio: `2026-10-19T${slots[i][0]}-03:00`, fim: `2026-10-19T${slots[i][1]}-03:00` },
          { inicio: `2026-10-20T${slots[i][0]}-03:00`, fim: `2026-10-20T${slots[i][1]}-03:00` },
        ]
      });
      expect(r.status).toBe(201);
      ids.push(r.body.id);
    }
    for (let i = 0; i < 3; i++) {
      await request(app).post(`/atividades/${ids[i]}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    const resp = await request(app).post(`/atividades/${ids[3]}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('LIMITE_DE_MINICURSOS');
  });
});
