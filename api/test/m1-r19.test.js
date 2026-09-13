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

describe('M1-R19 — só organização cria atividades (POST /atividades)', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('organização prossegue e cria a atividade', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida);

    expect(resposta.status).toBe(201);
  });

  it('organização continua vendo as regras do recurso (2 encontros em palestra -> 422)', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const corpo = {
      ...palestraValida,
      encontros: [
        { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
        { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
      ]
    };

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(corpo);

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
  });

  it('participante é recusado com 403 SOMENTE_ORGANIZACAO e nada é criado', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'p-carla')
      .send(palestraValida);

    expect(resposta.status).toBe(403);
    expect(resposta.body.erro).toBe('SOMENTE_ORGANIZACAO');

    const lista = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
    expect(lista.body).toEqual([]);
  });

  it('requisição sem cabeçalho X-Usuario responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).post('/atividades').send(palestraValida);

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('X-Usuario com id desconhecido responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'ninguem')
      .send(palestraValida);

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });
});