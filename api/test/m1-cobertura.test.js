process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('Cobertura apontada pela auditoria', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  describe('R8 — intervalo de 0 minutos na mesma sala', () => {
    it('encontros encostados (fim = início) geram CONFLITO_DE_SALA', async () => {
      await request(app).post('/_teste/reset').expect(204);
      await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Primeira',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
        })
        .expect(201);

      const resposta = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Encostada',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }]
        });

      expect(resposta.status).toBe(409);
      expect(resposta.body.erro).toBe('CONFLITO_DE_SALA');
    });
  });

  describe('R19 — sem regra de dono por organização', () => {
    it('org-bruno altera atividade criada por org-ana', async () => {
      await request(app).post('/_teste/reset').expect(204);
      const criacao = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Flutter do zero',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
            { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
          ]
        })
        .expect(201);

      const patch = await request(app)
        .patch(`/atividades/${criacao.body.id}`)
        .set('X-Usuario', 'org-bruno')
        .send({ titulo: 'Renomeada' });

      expect(patch.status).toBe(200);
      expect(patch.body.titulo).toBe('Renomeada');
    });

    it('org-bruno cancela atividade criada por org-ana', async () => {
      await request(app).post('/_teste/reset').expect(204);
      const criacao = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Flutter do zero',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
            { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
          ]
        })
        .expect(201);

      const cancelamento = await request(app)
        .post(`/atividades/${criacao.body.id}/cancelamento`)
        .set('X-Usuario', 'org-bruno')
        .send({});

      expect(cancelamento.status).toBe(200);
      expect(cancelamento.body.situacao).toBe('cancelada');
    });
  });

  describe('Shape completo de Atividade (contrato)', () => {
    it('resposta do POST com os 11 campos e valores determináveis', async () => {
      await request(app).post('/_teste/reset').expect(204);
      const resposta = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Flutter do zero',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
            { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
          ]
        })
        .expect(201);

      const corpo = resposta.body;
      expect(corpo.id).toMatch(/^atv_[0-9a-f]{8}$/);
      expect(corpo.titulo).toBe('Flutter do zero');
      expect(corpo.tipo).toBe('minicurso');
      expect(corpo.salaId).toBe('lab-3');
      expect(corpo.vagas).toBe(20);
      expect(corpo.encontros).toHaveLength(2);
      expect(corpo.encontros.map((e) => e.inicio)).toEqual([
        '2026-10-19T19:00:00-03:00',
        '2026-10-20T19:00:00-03:00'
      ]);
      for (const encontro of corpo.encontros) {
        expect(encontro.id).toMatch(/^enc_[0-9a-f]{8}$/);
        expect(encontro.inicio).toBeDefined();
        expect(encontro.fim).toBeDefined();
      }
      expect(corpo.cargaHorariaMinutos).toBe(360);
      expect(corpo.situacao).toBe('prevista');
      expect(corpo).toHaveProperty('ocupadas');
      expect(corpo).toHaveProperty('vagasRestantes');
      expect(corpo).toHaveProperty('emEspera');
    });
  });
});