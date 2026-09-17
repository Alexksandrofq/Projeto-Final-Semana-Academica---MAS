process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-206 — Duplicidade', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa segunda inscrição ativa na mesma atividade com 409 JA_INSCRITO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const atividade = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

    const atividadeId = atividade.body.id;

    // Primeira inscrição
    await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    // Segunda inscrição na mesma atividade
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('JA_INSCRITO');
  });

  it('recusa reinscrição de quem está em_espera com 409 JA_INSCRITO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const atividade = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

    const atividadeId = atividade.body.id;

    // A ocupa a vaga (confirmada), B fica em_espera
    await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);
    const espera = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao')
      .expect(201);
    expect(espera.body.status).toBe('em_espera');

    // B tenta se reinscrever na mesma atividade
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao');

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('JA_INSCRITO');
  });

  it('recusa reinscrição de quem está convocada com 409 JA_INSCRITO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const atividade = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

    const atividadeId = atividade.body.id;

    const ocupa = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);
    const espera = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao')
      .expect(201);

    // libera a vaga → B vira convocada
    await request(app)
      .post(`/inscricoes/${ocupa.body.id}/cancelamento`)
      .set('X-Usuario', 'p-carla')
      .expect(200);
    const atual = await request(app)
      .get(`/inscricoes/${espera.body.id}`)
      .set('X-Usuario', 'p-joao')
      .expect(200);
    expect(atual.body.status).toBe('convocada');

    // B tenta se reinscrever na mesma atividade
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao');

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('JA_INSCRITO');
  });
});
