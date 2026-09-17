process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-218/219/210/209 — Precedência no POST', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('JA_INSCRITO precede CONFLITO_DE_HORARIO (mesma atividade sobrepõe consigo)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas: 20,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    const id = r.body.id;
    await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const resp = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('JA_INSCRITO');
  });

  it('ATIVIDADE_CANCELADA precede INSCRICOES_ENCERRADAS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini', tipo: 'minicurso', salaId: 'lab-3', vagas: 20,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    const id = r.body.id;
    await request(app).post(`/atividades/${id}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T18:45:00-03:00' });
    const resp = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('CONFLITO_DE_HORARIO precede LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const salas = ['sala-101', 'sala-102', 'lab-3', 'auditorio'];
    const slots = [['08:00:00','10:00:00'],['11:00:00','13:00:00'],['14:00:00','16:00:00'],['08:00:00','10:00:00']];
    const ids = [];
    for (let i = 0; i < 4; i++) {
      const rr = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
        titulo: `M${i}`, tipo: 'minicurso', salaId: salas[i], vagas: 20,
        encontros: [
          { inicio: `2026-10-${19+i}T${slots[i][0]}-03:00`, fim: `2026-10-${19+i}T${slots[i][1]}-03:00` },
          { inicio: `2026-10-23T${String(8+i).padStart(2,'0')}:00:00-03:00`, fim: `2026-10-23T${String(9+i).padStart(2,'0')}:00:00-03:00` },
        ]
      });
      ids.push(rr.body.id);
    }
    // ajusta: 4º conflita com 1º no 1º encontro (mesmo dia/hora do M0) mas em sala distinta
    // recria 4º sobreposto: cancela e recria? simplifica: usa ids[0] como base de conflito
    for (let i = 0; i < 3; i++) {
      await request(app).post(`/atividades/${ids[i]}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    // ids[3] foi criado com mesmo slot de ids[0] (08-10) porém dia 22 vs 19 -> não conflita. Força conflito criando atividade extra sobreposta:
    const rc = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Conflitante', tipo: 'minicurso', salaId: 'sala-102', vagas: 20,
      encontros: [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
        { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' }
      ]
    });
    const resp = await request(app).post(`/atividades/${rc.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('CONFLITO_DE_HORARIO');
  });
});
