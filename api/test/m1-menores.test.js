process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

const palestraValida = {
  titulo: 'Palestra',
  tipo: 'palestra',
  salaId: 'sala-101',
  vagas: 20,
  encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
};

describe('Casos menores da auditoria', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('GET /atividades/:id com id inexistente responde 404 NAO_ENCONTRADO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/atividades/atv_00000000').set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('NAO_ENCONTRADO');
  });

  it('cancelar atividade encerrada responde 422 ATIVIDADE_JA_INICIADA', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida)
      .expect(201);

    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T12:00:00-03:00' }).expect(200);

    const resposta = await request(app)
      .post(`/atividades/${criacao.body.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ATIVIDADE_JA_INICIADA');
  });
});