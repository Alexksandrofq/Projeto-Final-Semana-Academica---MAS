process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-205 — Capacidade e Lista de Espera', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('deve confirmar inscrição quando há vagas', async () => {
    await request(app).post('/_teste/reset').expect(204);

    // 1. Criar uma atividade com 1 vaga
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

    // 2. Inscrever um participante
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    expect(resposta.body.status).toBe('confirmada');
  });

  it('deve colocar em espera quando não há vagas', async () => {
    await request(app).post('/_teste/reset').expect(204);

    // 1. Criar uma atividade com 1 vaga
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

    // 2. Inscrever o primeiro participante (confirmada)
    await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);

    // 3. Inscrever o segundo participante (espera)
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao')
      .expect(201);

    expect(resposta.body.status).toBe('em_espera');
    expect(resposta.body.posicaoNaEspera).toBe(1);
  });
});
