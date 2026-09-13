process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

const palestraValida = {
  titulo: 'Palestra',
  tipo: 'palestra',
  salaId: 'sala-101',
  vagas: 20,
  encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }]
};

describe('M1-R16/R17 — cancelamento de atividade', () => {
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

  it('cancela antes do início com 200 e situacao cancelada', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(resposta.status).toBe(200);
    expect(resposta.body.situacao).toBe('cancelada');

    const consulta = await request(app)
      .get(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'p-diego');
    expect(consulta.body.situacao).toBe('cancelada');
  });

  it('recusa cancelamento no instante exato do início com 422 ATIVIDADE_JA_INICIADA', async () => {
    const atividade = await criarAtividade();

    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T10:00:00-03:00' }).expect(200);

    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ATIVIDADE_JA_INICIADA');
  });

  it('recusa cancelamento depois do início com 422 ATIVIDADE_JA_INICIADA', async () => {
    const atividade = await criarAtividade();

    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T10:30:00-03:00' }).expect(200);

    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ATIVIDADE_JA_INICIADA');
  });

  it('recusa cancelar atividade já cancelada com 422 ATIVIDADE_CANCELADA', async () => {
    const atividade = await criarAtividade();

    const primeiro = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});
    expect(primeiro.status).toBe(200);

    const segundo = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(segundo.status).toBe(422);
    expect(segundo.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('cancelamento em atividade inexistente responde 404 NAO_ENCONTRADO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades/atv_00000000/cancelamento')
      .set('X-Usuario', 'org-ana')
      .send({});

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('NAO_ENCONTRADO');
  });
});

describe('M1-R16/R17 — cancelamento exige organização', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  async function setup() {
    await request(app).post('/_teste/reset').expect(204);
    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida);
    return criacao.body;
  }

  it('participante recebe 403 SOMENTE_ORGANIZACAO', async () => {
    const atividade = await setup();
    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'p-carla')
      .send({});

    expect(resposta.status).toBe(403);
    expect(resposta.body.erro).toBe('SOMENTE_ORGANIZACAO');
  });

  it('sem cabeçalho X-Usuario recebe 401 USUARIO_DESCONHECIDO', async () => {
    const atividade = await setup();
    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .send({});

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('X-Usuario desconhecido recebe 401 USUARIO_DESCONHECIDO', async () => {
    const atividade = await setup();
    const resposta = await request(app)
      .post(`/atividades/${atividade.id}/cancelamento`)
      .set('X-Usuario', 'ninguem')
      .send({});

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });
});