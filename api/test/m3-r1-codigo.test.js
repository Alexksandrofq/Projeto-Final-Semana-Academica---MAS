process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M3-R1 — GET /encontros/:id/codigo dentro da janela', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('retorna 200 CodigoDoEncontro quando consultado pela organização dentro da janela', async () => {
    await request(app).post('/_teste/reset').expect(204);

    // Ajusta relógio para perto da atividade
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T18:50:00-03:00' })
      .expect(200);

    // Cria uma atividade para gerar encontro
    const resAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra de Abertura',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' }
        ]
      });

    const encontroId = resAtv.body.encontros[0].id;

    // Consulta o código dentro da janela (19:00 - 15min = 18:45 até 21:30)
    const resposta = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(resposta.status).toBe(200);
    expect(resposta.body.encontroId).toBe(encontroId);
    expect(typeof resposta.body.codigo).toBe('string');
    expect(resposta.body.codigo.length).toBe(6);
    expect(resposta.body.trocaEm).toBeDefined();
    expect(resposta.body.validoAte).toBeDefined();
  });
});
