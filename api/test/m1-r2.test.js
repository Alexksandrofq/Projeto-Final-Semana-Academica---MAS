process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M1-R2 — minicurso deve ter de 2 a 5 encontros', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('recusa minicurso com 1 encontro com 422 QUANTIDADE_DE_ENCONTROS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso com um encontro',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
        ]
      });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
  });

  it('recusa minicurso com 6 encontros com 422 QUANTIDADE_DE_ENCONTROS', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const encontros = [];
    for (let i = 0; i < 6; i++) {
      const inicio = `2026-10-19T${String(7 + i).padStart(2, '0')}:00:00-03:00`;
      const fim = `2026-10-19T${String(8 + i).padStart(2, '0')}:00:00-03:00`;
      encontros.push({ inicio, fim });
    }

    const resposta = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso com seis encontros',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros
      });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
  });
});