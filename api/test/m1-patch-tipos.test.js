process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

const atividadeValida = {
  titulo: 'Flutter do zero',
  tipo: 'minicurso',
  salaId: 'lab-3',
  vagas: 20,
  encontros: [
    { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
  ]
};

describe('PATCH /atividades/:id — tipo de campo (422 DADOS_INVALIDOS)', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  async function criarAtividade() {
    await request(app).post('/_teste/reset').expect(204);
    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(atividadeValida)
      .expect(201);
    return criacao.body;
  }

  it('titulo com tipo errado responde 422 DADOS_INVALIDOS e não altera o título', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 123 });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('DADOS_INVALIDOS');

    const atual = await request(app).get(`/atividades/${atividade.id}`).set('X-Usuario', 'p-diego');
    expect(atual.body.titulo).toBe('Flutter do zero');
  });

  it('vagas com tipo errado responde 422 DADOS_INVALIDOS e não altera as vagas', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: '20' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('DADOS_INVALIDOS');

    const atual = await request(app).get(`/atividades/${atividade.id}`).set('X-Usuario', 'p-diego');
    expect(atual.body.vagas).toBe(20);
  });
});