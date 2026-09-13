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

describe('M1-R6 — cada encontro no mesmo dia civil e dentro do período do evento', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa encontro que cruza a meia-noite com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('2026-10-19T23:00:00-03:00', '2026-10-20T00:30:00-03:00'));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });

  it('recusa encontro antes de 2026-10-19 com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('2026-10-18T19:00:00-03:00', '2026-10-18T20:00:00-03:00'));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });

  it('recusa encontro depois de 2026-10-23 com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('2026-10-24T19:00:00-03:00', '2026-10-24T20:00:00-03:00'));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });
});