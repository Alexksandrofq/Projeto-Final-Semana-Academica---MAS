process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M1-R9 — situacao calculada pelo relógio de teste', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  async function criarPalestra() {
    await request(app).post('/_teste/reset').expect(204);

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra de teste',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 100,
        encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }]
      });

    if (criacao.status !== 201) {
      throw new Error(`criação falhou com status ${criacao.status}`);
    }
    return criacao.body;
  }

  async function situacaoComRelogio(id, momento) {
    await request(app).put('/_teste/relogio').send({ agora: momento }).expect(200);
    const resposta = await request(app).get(`/atividades/${id}`).set('X-Usuario', 'p-diego');
    return resposta.body.situacao;
  }

  it('relógio imediatamente antes do início -> prevista', async () => {
    const atividade = await criarPalestra();
    const situacao = await situacaoComRelogio(atividade.id, '2026-10-19T09:59:59-03:00');
    expect(situacao).toBe('prevista');
  });

  it('relógio no instante exato do início -> em_andamento', async () => {
    const atividade = await criarPalestra();
    const situacao = await situacaoComRelogio(atividade.id, '2026-10-19T10:00:00-03:00');
    expect(situacao).toBe('em_andamento');
  });

  it('relógio durante a atividade -> em_andamento', async () => {
    const atividade = await criarPalestra();
    const situacao = await situacaoComRelogio(atividade.id, '2026-10-19T11:30:00-03:00');
    expect(situacao).toBe('em_andamento');
  });

  it('relógio no instante exato do fim do último encontro -> encerrada', async () => {
    const atividade = await criarPalestra();
    const situacao = await situacaoComRelogio(atividade.id, '2026-10-19T12:00:00-03:00');
    expect(situacao).toBe('encerrada');
  });
});