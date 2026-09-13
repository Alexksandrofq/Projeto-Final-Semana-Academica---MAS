process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M1 — CORS para a interface local', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('GET /atividades com origem da interface responde com Access-Control-Allow-Origin', async () => {
    const resposta = await request(app)
      .get('/atividades')
      .set('Origin', 'http://localhost:5500')
      .set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['access-control-allow-origin']).toBe('http://localhost:5500');
  });

  it('GET /atividades com origem desconhecida não libera a origem', async () => {
    const resposta = await request(app)
      .get('/atividades')
      .set('Origin', 'http://origem-desconhecida.example')
      .set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight OPTIONS com origem permitida responde 204 com origem, métodos e cabeçalhos', async () => {
    const resposta = await request(app)
      .options('/atividades')
      .set('Origin', 'http://localhost:5500')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'x-usuario');

    expect(resposta.status).toBe(204);
    expect(resposta.headers['access-control-allow-origin']).toBe('http://localhost:5500');
    expect(resposta.headers['access-control-allow-methods']).toBe(
      'GET, POST, PATCH, PUT, DELETE'
    );
    expect(resposta.headers['access-control-allow-headers'].toLowerCase()).toContain(
      'x-usuario'
    );
  });
});