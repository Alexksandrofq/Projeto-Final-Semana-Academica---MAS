process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('POST /atividades — corpo malformado e identificação', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('JSON malformado sem X-Usuario responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('Content-Type', 'application/json')
      .send('{nao-e-json');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('JSON malformado com X-Usuario desconhecido responde 401 USUARIO_DESCONHECIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'quem-e-voce')
      .set('Content-Type', 'application/json')
      .send('{nao-e-json');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('USUARIO_DESCONHECIDO');
  });
});