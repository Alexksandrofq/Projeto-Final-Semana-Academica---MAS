process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

const palestraValida = {
  titulo: 'Palestra',
  tipo: 'palestra',
  salaId: 'sala-101',
  vagas: 20,
  encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
};

describe('Fechamentos pós-cancelamento', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  async function criarECancelar() {
    await request(app).post('/_teste/reset').expect(204);
    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send(palestraValida);
    if (criacao.status !== 201) {
      throw new Error(`criação falhou com status ${criacao.status}`);
    }
    const cancelamento = await request(app)
      .post(`/atividades/${criacao.body.id}/cancelamento`)
      .set('X-Usuario', 'org-ana')
      .send({});
    if (cancelamento.status !== 200) {
      throw new Error(`cancelamento falhou com status ${cancelamento.status}`);
    }
    return criacao.body;
  }

  it('R15 — PATCH em atividade cancelada responde 422 ATIVIDADE_CANCELADA', async () => {
    const atividade = await criarECancelar();

    const resposta = await request(app)
      .patch(`/atividades/${atividade.id}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Título novo' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('R8 — encontros de atividade cancelada não geram CONFLITO_DE_SALA', async () => {
    const atividade = await criarECancelar();

    const nova = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Depois da cancelada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [{ inicio: '2026-10-19T10:45:00-03:00', fim: '2026-10-19T11:45:00-03:00' }]
      });

    expect(nova.status).toBe(201);
    expect(atividade.id).not.toBe(nova.body.id);
  });

  it('R10 — atividade cancelada continua aparecendo no GET /atividades', async () => {
    const atividade = await criarECancelar();

    const lista = await request(app).get('/atividades');

    expect(lista.status).toBe(200);
    const encontrada = lista.body.find((a) => a.id === atividade.id);
    expect(encontrada).toBeDefined();
    expect(encontrada.situacao).toBe('cancelada');
  });
});