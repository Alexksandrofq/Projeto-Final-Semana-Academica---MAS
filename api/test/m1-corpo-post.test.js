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

describe('POST /atividades — validação de corpo (422 DADOS_INVALIDOS)', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it.each(['titulo', 'tipo', 'salaId', 'vagas', 'encontros'])(
    'campo obrigatório ausente (%s) responde 422 DADOS_INVALIDOS',
    async (campo) => {
      await request(app).post('/_teste/reset').expect(204);
      const corpo = { ...atividadeValida };
      delete corpo[campo];

      const resposta = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send(corpo);

      expect(resposta.status).toBe(422);
      expect(resposta.body.erro).toBe('DADOS_INVALIDOS');
    }
  );

  it('vagas com tipo errado responde 422 DADOS_INVALIDOS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({ ...atividadeValida, vagas: '20' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('DADOS_INVALIDOS');
  });

  it('encontros que não é array responde 422 DADOS_INVALIDOS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({ ...atividadeValida, encontros: { inicio: '2026-10-19T19:00:00-03:00' } });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('DADOS_INVALIDOS');
  });

  it('corpo que não é JSON válido responde 422 DADOS_INVALIDOS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .set('Content-Type', 'application/json')
      .send('{nao-e-json');

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('DADOS_INVALIDOS');
  });
});