process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

function minicurso(cargaEnviada) {
  const corpo = {
    titulo: 'Minicurso',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 20,
    encontros: [
      { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
      { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
    ]
  };
  if (cargaEnviada !== undefined) {
    corpo.cargaHorariaMinutos = cargaEnviada;
  }
  return corpo;
}

describe('M1-R12 — cargaHorariaMinutos calculada pela soma das durações', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('soma dois encontros de 3 horas e responde 360, no POST e no GET', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(minicurso());

    expect(criacao.status).toBe(201);
    expect(criacao.body.cargaHorariaMinutos).toBe(360);

    const consulta = await request(app)
      .get(`/atividades/${criacao.body.id}`)
      .set('X-Usuario', 'p-diego');

    expect(consulta.status).toBe(200);
    expect(consulta.body.cargaHorariaMinutos).toBe(360);
  });

  it('ignora cargaHorariaMinutos: 999 enviado pelo cliente', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(minicurso(999));

    expect(criacao.status).toBe(201);
    expect(criacao.body.cargaHorariaMinutos).toBe(360);
  });
});