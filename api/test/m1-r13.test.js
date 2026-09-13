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

describe('M1-R13 — PATCH /atividades/:id só aceita titulo e vagas', () => {
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

  it('altera somente o titulo com 200 e reflete no GET', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Título novo' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.titulo).toBe('Título novo');
    expect(resposta.body.tipo).toBe('palestra');

    const consulta = await request(app)
      .get(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'p-diego');
    expect(consulta.body.titulo).toBe('Título novo');
  });

  it('altera somente vagas com 200', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 15 });

    expect(resposta.status).toBe(200);
    expect(resposta.body.vagas).toBe(15);
  });

  it('recusa alterar tipo com 422 CAMPO_NAO_EDITAVEL', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ tipo: 'minicurso' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('CAMPO_NAO_EDITAVEL');
  });

  it('recusa alterar salaId com 422 CAMPO_NAO_EDITAVEL', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ salaId: 'lab-3' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('CAMPO_NAO_EDITAVEL');
  });

  it('recusa alterar encontros com 422 CAMPO_NAO_EDITAVEL', async () => {
    const atividade = await criarAtividade();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }] });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('CAMPO_NAO_EDITAVEL');
  });

  it('PATCH em atividade inexistente responde 404 NAO_ENCONTRADO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .patch('/atividades/atv_00000000')
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Nada' });

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('NAO_ENCONTRADO');
  });
});

describe('M1-R13 — PATCH exige organização', () => {
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
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'p-carla')
      .send({ titulo: 'Bloqueado' });

    expect(resposta.status).toBe(403);
    expect(resposta.body.erro).toBe('SOMENTE_ORGANIZACAO');
  });

  it('sem cabeçalho X-Usuario recebe 401 USUARIO_DESCONHECIDO', async () => {
    const atividade = await setup();
    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .send({ titulo: 'Bloqueado' });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('X-Usuario desconhecido recebe 401 USUARIO_DESCONHECIDO', async () => {
    const atividade = await setup();
    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'ninguem')
      .send({ titulo: 'Bloqueado' });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });
});