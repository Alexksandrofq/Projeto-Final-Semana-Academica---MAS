process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

function minicursoValido(vagas) {
  return {
    titulo: 'Minicurso',
    tipo: 'minicurso',
    salaId: 'sala-101',
    vagas,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
    ]
  };
}

describe('M1-R3 — vagas deve ser no mínimo 1', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa vagas zero com 422 (código específico pendente)', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(minicursoValido(0));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBeDefined();
    expect(resposta.body.mensagem).toBeDefined();
  });
});

describe('M1-R4 — vagas não pode ultrapassar a capacidade da sala', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa vagas acima da capacidade com 422 VAGAS_ACIMA_DA_CAPACIDADE', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(minicursoValido(41));

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('VAGAS_ACIMA_DA_CAPACIDADE');
  });
});