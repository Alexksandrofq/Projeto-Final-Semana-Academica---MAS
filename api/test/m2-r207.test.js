process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

async function criarAtividade(app, titulo, salaId, encontros) {
  const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
    titulo, tipo: 'minicurso', salaId, vagas: 20, encontros
  });
  return r.body.id;
}

describe('M2-RN-207 — Conflito de Horário', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  it('recusa inscrição com encontro sobreposto quando já confirmada com 409 CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const a1 = await criarAtividade(app, 'Flutter A', 'sala-101', [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]);
    const a2 = await criarAtividade(app, 'Flutter B', 'sala-102', [
      { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }
    ]);
    await request(app).post(`/atividades/${a1}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const resp = await request(app).post(`/atividades/${a2}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('CONFLITO_DE_HORARIO');
  });

  it('não considera em_espera como conflito', async () => {
    await request(app).post('/_teste/reset').expect(204);
    // a1 com 1 vaga, lotada por outro participante; p-carla fica em_espera
    const a1 = await criarAtividade(app, 'Lotada', 'sala-101', [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
    ]);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T09:00:00-03:00' });
    // reduz vagas para 1 via PATCH? cria com vagas 20 então ajusta direto: usa 1 vaga desde início
    // Para simplificar: inscreve p-joao primeiro (confirmada), depois p-carla (em_espera)
    // Como vagas=20, precisamos de atividade com 1 vaga:
    const aLot = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Mini 1 vaga', tipo: 'minicurso', salaId: 'lab-3', vagas: 1,
      encontros: [
        { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
        { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
      ]
    });
    const aLotId = aLot.body.id;
    await request(app).post(`/atividades/${aLotId}/inscricoes`).set('X-Usuario', 'p-joao').expect(201);
    const espera = await request(app).post(`/atividades/${aLotId}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    expect(espera.body.status).toBe('em_espera');

    const a2 = await criarAtividade(app, 'Sobreposta', 'sala-102', [
      { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }
    ]);
    const resp = await request(app).post(`/atividades/${a2}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    expect(resp.body.status).toBe('confirmada');
  });
});
