process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

function palestra(titulo, salaId, inicio, fim) {
  return {
    titulo,
    tipo: 'palestra',
    salaId,
    vagas: 20,
    encontros: [{ inicio, fim }]
  };
}

describe('M1-R8 — 15 minutos entre encontros de atividades diferentes na mesma sala', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa atividade que começa 14 minutos depois do fim de outra na mesma sala com 409 CONFLITO_DE_SALA', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const primeira = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Primeira', 'sala-101', '2026-10-19T10:00:00-03:00', '2026-10-19T12:00:00-03:00'));
    expect(primeira.status).toBe(201);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Segunda', 'sala-101', '2026-10-19T12:14:00-03:00', '2026-10-19T13:14:00-03:00'));

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe('CONFLITO_DE_SALA');
  });

  it('aceita atividade que começa exatamente 15 minutos depois na mesma sala', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const primeira = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Primeira', 'sala-101', '2026-10-19T10:00:00-03:00', '2026-10-19T12:00:00-03:00'));
    expect(primeira.status).toBe(201);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Segunda', 'sala-101', '2026-10-19T12:15:00-03:00', '2026-10-19T13:15:00-03:00'));

    expect(resposta.status).toBe(201);
    expect(resposta.body.erro).not.toBe('CONFLITO_DE_SALA');
  });

  it('aceita horários sobrepostos em salas diferentes', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const primeira = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Primeira', 'sala-101', '2026-10-19T10:00:00-03:00', '2026-10-19T12:00:00-03:00'));
    expect(primeira.status).toBe(201);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestra('Outra', 'sala-102', '2026-10-19T10:30:00-03:00', '2026-10-19T12:30:00-03:00'));

    expect(resposta.status).toBe(201);
    expect(resposta.body.erro).not.toBe('CONFLITO_DE_SALA');
  });
});