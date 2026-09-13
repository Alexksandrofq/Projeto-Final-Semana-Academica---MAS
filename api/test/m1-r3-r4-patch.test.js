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

describe('M1-R3/R4 no PATCH — vagas continua no mínimo 1 e no máximo a capacidade', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  async function criarAtividade() {
    await request(app).post('/_teste/reset').expect(204);
    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida);
    if (criacao.status !== 201) {
      throw new Error(`criação falhou com status ${criacao.status}`);
    }
    return criacao.body;
  }

  it('recusa PATCH com vagas zero com 422, sem fixar o código', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 0 });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBeDefined();
    expect(resposta.body.mensagem).toBeDefined();
  });

  it('recusa PATCH com vagas acima da capacidade com 422 VAGAS_ACIMA_DA_CAPACIDADE', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 41 });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('VAGAS_ACIMA_DA_CAPACIDADE');
  });

  it('aceita PATCH com vagas dentro de 1..capacidade', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 30 });

    expect(resposta.status).toBe(200);
    expect(resposta.body.vagas).toBe(30);
  });
});