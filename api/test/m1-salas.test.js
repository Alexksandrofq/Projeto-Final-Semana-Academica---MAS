process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('GET /salas', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('retorna a lista de salas para usuário identificado', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/salas').set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(4);
  });

  it('devolve o shape Sala conforme o contrato', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app).get('/salas').set('X-Usuario', 'p-carla');

    const porId = Object.fromEntries(resposta.body.map((sala) => [sala.id, sala]));
    expect(porId['auditorio']).toEqual({ id: 'auditorio', nome: 'Auditório Central', capacidade: 200 });
    expect(porId['sala-101']).toEqual({ id: 'sala-101', nome: 'Sala 101', capacidade: 40 });
    expect(porId['sala-102']).toEqual({ id: 'sala-102', nome: 'Sala 102', capacidade: 40 });
    expect(porId['lab-3']).toEqual({ id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 });
  });
});