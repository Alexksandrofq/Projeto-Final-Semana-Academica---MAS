process.env.MODO_TESTE = '1';
const request = require('supertest');
const { criarServidor } = require('../src/app');

// Ponto 5: pares de precedência faltantes do POST (RN-218/219/210/209).
// Origem: entrevistas/M2-inscricoes.mc P7; spec RN-218/219/210/209.
// Nota: INSCRICAO_BLOQUEADA só existe em grupos com M5 (contrato §6); sem M5
// neste repositório ela nunca dispara — a ordem testável é a de 5 níveis.
describe('M2 precedência no POST — pares faltantes', () => {
  let app;
  beforeEach(() => { app = criarServidor(); });

  async function criar(app, titulo, salaId, encontros, vagas = 20) {
    const r = await request(app).post('/atividades').set('X-Usuario', 'org-ana')
      .send({ titulo, tipo: 'minicurso', salaId, vagas, encontros });
    expect(r.status).toBe(201);
    return r.body.id;
  }

  const ENC = [
    { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T21:00:00-03:00' },
    { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T21:00:00-03:00' }
  ];
  const ENC_SOBREPOSTO = [
    { inicio: '2026-10-19T20:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T21:00:00-03:00' }
  ];

  it('INSCRICOES_ENCERRADAS precede JA_INSCRITO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criar(app, 'Mini', 'lab-3', ENC);
    await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T18:30:00-03:00' }).expect(200);
    const resp = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('INSCRICOES_ENCERRADAS');
  });

  it('JA_INSCRITO precede LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'lab-3'];
    const ids = [];
    for (let i = 0; i < 3; i++) {
      ids.push(await criar(app, `M${i}`, salas[i], [
        { inicio: `2026-10-19T${slots[i][0]}-03:00`, fim: `2026-10-19T${slots[i][1]}-03:00` },
        { inicio: `2026-10-20T${slots[i][0]}-03:00`, fim: `2026-10-20T${slots[i][1]}-03:00` },
      ]));
    }
    for (const id of ids) {
      await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    // já inscrita em ids[0] e no limite (3) → JA vem antes de LIMITE
    const resp = await request(app).post(`/atividades/${ids[0]}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(409);
    expect(resp.body.erro).toBe('JA_INSCRITO');
  });

  it('INSCRICOES_ENCERRADAS precede CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const base = await criar(app, 'Base', 'sala-101', ENC);
    await request(app).post(`/atividades/${base}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const alvo = await criar(app, 'Alvo', 'sala-102', ENC_SOBREPOSTO);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T19:30:00-03:00' }).expect(200);
    const resp = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('INSCRICOES_ENCERRADAS');
  });

  it('ATIVIDADE_CANCELADA precede JA_INSCRITO (competição inalcançável: ordem por inspeção)', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const id = await criar(app, 'Mini', 'lab-3', ENC);
    await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    await request(app).post(`/atividades/${id}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);
    // Competição real é inalcançável via API pública, por invariante do código:
    // o único caminho que põe atividade.cancelada=true (POST .../cancelamento)
    // converte em cascata TODAS as inscrições ativas da atividade para
    // `cancelada` (api/src/app.js:534-540), e JA_INSCRITO só é verdadeiro com
    // inscrição ativa na mesma atividade (api/src/banco.js:119). Logo, quando
    // ATIVIDADE_CANCELADA é verdadeira, JA_INSCRITO é sempre falso — a ordem
    // entre elas é vacuamente satisfeita e vale por inspeção
    // (api/src/app.js:568 antes de 585). Este teste trava o comportamento
    // observável: ex-inscrita tenta reinscrever na atividade cancelada.
    const resp = await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('ATIVIDADE_CANCELADA precede CONFLITO_DE_HORARIO', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const base = await criar(app, 'Base', 'sala-101', ENC);
    await request(app).post(`/atividades/${base}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    const alvo = await criar(app, 'Alvo', 'sala-102', ENC_SOBREPOSTO);
    await request(app).post(`/atividades/${alvo}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);
    // conflito real (base ativa sobrepõe o alvo) + alvo cancelado → CANCELADA primeiro
    const resp = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('ATIVIDADE_CANCELADA precede LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'lab-3'];
    for (let i = 0; i < 3; i++) {
      const id = await criar(app, `M${i}`, salas[i], [
        { inicio: `2026-10-19T${slots[i][0]}-03:00`, fim: `2026-10-19T${slots[i][1]}-03:00` },
        { inicio: `2026-10-20T${slots[i][0]}-03:00`, fim: `2026-10-20T${slots[i][1]}-03:00` },
      ]);
      await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    // participante no limite de 3 tenta o 4º, que está cancelado
    const alvo = await criar(app, 'Alvo cancelado', 'auditorio', [
      { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' },
      { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T10:00:00-03:00' },
    ]);
    await request(app).post(`/atividades/${alvo}/cancelamento`).set('X-Usuario', 'org-ana').expect(200);
    const resp = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('INSCRICOES_ENCERRADAS precede LIMITE_DE_MINICURSOS', async () => {
    await request(app).post('/_teste/reset').expect(204);
    const slots = [['08:00:00', '10:00:00'], ['11:00:00', '13:00:00'], ['14:00:00', '16:00:00']];
    const salas = ['sala-101', 'sala-102', 'lab-3'];
    for (let i = 0; i < 3; i++) {
      const id = await criar(app, `M${i}`, salas[i], [
        { inicio: `2026-10-19T${slots[i][0]}-03:00`, fim: `2026-10-19T${slots[i][1]}-03:00` },
        { inicio: `2026-10-20T${slots[i][0]}-03:00`, fim: `2026-10-20T${slots[i][1]}-03:00` },
      ]);
      await request(app).post(`/atividades/${id}/inscricoes`).set('X-Usuario', 'p-carla').expect(201);
    }
    // 4º sem sobreposição de horário (sem conflito), mas com janela encerrada
    const alvo = await criar(app, 'Alvo', 'auditorio', [
      { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' },
      { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T10:00:00-03:00' },
    ]);
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-21T07:45:00-03:00' }).expect(200);
    const resp = await request(app).post(`/atividades/${alvo}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(resp.status).toBe(422);
    expect(resp.body.erro).toBe('INSCRICOES_ENCERRADAS');
  });
});
