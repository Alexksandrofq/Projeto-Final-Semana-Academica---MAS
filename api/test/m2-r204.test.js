process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

describe('M2-RN-204 — Posição na Espera', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('deve recomputar a posição na espera após cancelamento', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const atividade = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

    const atividadeId = atividade.body.id;

    // Inscricao 1: confirmada
    const ins1 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .expect(201);
    
    // Avança relogio
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T10:00:00-03:00' });
    
    // Inscricao 2: espera 1
    const ins2 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-joao')
      .expect(201);
    
    // Avança relogio
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-13T11:00:00-03:00' });

    // Inscricao 3: espera 2
    const ins3 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-diego')
      .expect(201);

    expect(ins2.body.posicaoNaEspera).toBe(1);
    expect(ins3.body.posicaoNaEspera).toBe(2);

    // Cancelar inscricao 1
    await request(app)
      .post(`/inscricoes/${ins1.body.id}/cancelamento`)
      .set('X-Usuario', 'p-carla')
      .expect(200);

    // Verifica o status da inscricao 2 após a liberação da vaga.
    const ins2Atualizada = await request(app)
      .get(`/inscricoes/${ins2.body.id}`)
      .set('X-Usuario', 'p-joao')
      .expect(200);

    // RN-212/213: ao liberar a vaga, ins2 (primeira em_espera) é convocada;
    // RN-204: as posições restantes são recomputadas — ins3 passa a 1.
    expect(ins2Atualizada.body.status).toBe('convocada');
    const ins3Atualizada = await request(app)
      .get(`/inscricoes/${ins3.body.id}`)
      .set('X-Usuario', 'p-diego')
      .expect(200);

    expect(ins3Atualizada.body.posicaoNaEspera).toBe(1);
  });
});
