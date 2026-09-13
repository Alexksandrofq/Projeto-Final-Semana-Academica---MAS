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

describe('identificação nas rotas de leitura (contrato: cabeçalho X-Usuario em toda rota)', () => {
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

  it('GET /salas sem X-Usuario responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/salas');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /salas com X-Usuario inexistente responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/salas').set('X-Usuario', 'ninguem');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /atividades sem X-Usuario responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/atividades');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /atividades com X-Usuario inexistente responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/atividades').set('X-Usuario', 'ninguem');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /atividades/:id sem X-Usuario responde 401 USUARIO_DESCONHECIDO mesmo com id existente', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app).get(`/atividades/${atividade.id}`);

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /atividades/:id com X-Usuario inexistente responde 401 USUARIO_DESCONHECIDO mesmo com id existente', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app).get(`/atividades/${atividade.id}`).set('X-Usuario', 'ninguem');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('GET /salas identificado responde 200 com as salas', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/salas').set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(4);
  });

  it('GET /atividades/:id identificado responde 200 com a atividade', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app).get(`/atividades/${atividade.id}`).set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(atividade.id);
  });
});