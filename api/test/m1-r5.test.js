process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

function palestra(encInicio, encFim) {
  return {
    titulo: 'Palestra',
    tipo: 'palestra',
    salaId: 'auditorio',
    vagas: 100,
    encontros: [{ inicio: encInicio, fim: encFim }]
  };
}

describe('M1-R5 — cada encontro deve durar entre 1 e 4 horas', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa encontro com menos de 1 hora com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('2026-10-19T19:00:00-03:00', '2026-10-19T19:38:00-03:00'));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });

  it('recusa encontro com mais de 4 horas com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('2026-10-19T15:00:00-03:00', '2026-10-19T20:00:00-03:00'));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });
});