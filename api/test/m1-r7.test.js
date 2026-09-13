process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

function minicurso(encA, encB) {
  return {
    titulo: 'Minicurso',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 20,
    encontros: [encA, encB]
  };
}

describe('M1-R7 — encontros da mesma atividade não podem se sobrepor', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa sobreposição parcial com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(
        minicurso(
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' },
          { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' }
        )
      );

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });

  it('recusa encontro totalmente contido em outro com 422 ENCONTRO_INVALIDO', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(
        minicurso(
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' },
          { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }
        )
      );

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ENCONTRO_INVALIDO');
  });
});