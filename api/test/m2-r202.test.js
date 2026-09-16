process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-202 — Janela de Inscrição', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa inscrição 30 minutos antes do início do 1º encontro com 422 INSCRICOES_ENCERRADAS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    // 1. Criar uma atividade
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

    // 2. Setar o relógio para 30 minutos antes do início do encontro (19:00 - 30m = 18:30)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T18:30:00-03:00' })
      .expect(200);

    // 3. Tentar inscrever
    const resposta = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // 4. Verificar erro
    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('INSCRICOES_ENCERRADAS');
  });
});
