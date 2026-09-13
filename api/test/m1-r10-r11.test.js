process.env.MODO_TESTE = '1';

const request = require('supertest');
const { criarServidor } = require('../src/app');

const titulos = (lista) => lista.map((a) => a.titulo);

async function criar(app, corpo) {
  const resposta = await request(app)
    .post('/atividades')
    .set('X-Usuario', 'org-ana')
    .send(corpo);

  if (resposta.status !== 201) {
    throw new Error(`criação falhou com status ${resposta.status}: ${JSON.stringify(resposta.body)}`);
  }
  return resposta.body;
}

const palestra = (titulo, salaId, inicio, fim) => ({
  titulo,
  tipo: 'palestra',
  salaId,
  vagas: 20,
  encontros: [{ inicio, fim }]
});

const minicurso = (titulo, salaId, encontros) => ({
  titulo,
  tipo: 'minicurso',
  salaId,
  vagas: 20,
  encontros
});

describe('M1-R10 — GET /atividades ordena por início do primeiro encontro (empate por título)', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('ordena pelo início do primeiro encontro', async () => {
    await request(app).post('/_teste/reset').expect(204);

    await criar(app, palestra('ZZZ Tarde', 'sala-101', '2026-10-19T10:00:00-03:00', '2026-10-19T11:00:00-03:00'));
    await criar(app, palestra('AAA Manhã', 'sala-102', '2026-10-19T08:00:00-03:00', '2026-10-19T09:00:00-03:00'));

    const resposta = await request(app).get('/atividades').set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(titulos(resposta.body)).toEqual(['AAA Manhã', 'ZZZ Tarde']);
  });

  it('desempate pelo título quando o início é o mesmo', async () => {
    await request(app).post('/_teste/reset').expect(204);

    await criar(app, palestra('Bravo', 'sala-101', '2026-10-19T10:00:00-03:00', '2026-10-19T11:00:00-03:00'));
    await criar(app, palestra('Alfa', 'sala-102', '2026-10-19T10:00:00-03:00', '2026-10-19T11:00:00-03:00'));

    const resposta = await request(app).get('/atividades').set('X-Usuario', 'p-carla');

    expect(resposta.status).toBe(200);
    expect(titulos(resposta.body)).toEqual(['Alfa', 'Bravo']);
  });
});

describe('M1-R11 — filtros dia e tipo de GET /atividades', () => {
  let app;

  beforeEach(() => {
    app = criarServidor();
  });

  it('filtra por tipo', async () => {
    await request(app).post('/_teste/reset').expect(204);

    await criar(app, palestra('Palestra X', 'sala-101', '2026-10-21T09:00:00-03:00', '2026-10-21T10:00:00-03:00'));
    await criar(
      app,
      minicurso('Minicurso Y', 'lab-3', [
        { inicio: '2026-10-21T09:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' },
        { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T10:00:00-03:00' }
      ])
    );

    const soPalestras = await request(app).get('/atividades?tipo=palestra').set('X-Usuario', 'p-carla');
    expect(titulos(soPalestras.body)).toEqual(['Palestra X']);

    const soMinicursos = await request(app).get('/atividades?tipo=minicurso').set('X-Usuario', 'p-carla');
    expect(titulos(soMinicursos.body)).toEqual(['Minicurso Y']);
  });

  it('filtra por dia em Brasília, com encontro em qualquer dia', async () => {
    await request(app).post('/_teste/reset').expect(204);

    await criar(
      app,
      minicurso('Dois Dias', 'lab-3', [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
        { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
      ])
    );
    await criar(app, palestra('Outro Dia', 'sala-101', '2026-10-21T09:00:00-03:00', '2026-10-21T10:00:00-03:00'));

    const dia19 = await request(app).get('/atividades?dia=2026-10-19').set('X-Usuario', 'p-carla');
    expect(titulos(dia19.body)).toEqual(['Dois Dias']);

    const dia20 = await request(app).get('/atividades?dia=2026-10-20').set('X-Usuario', 'p-carla');
    expect(titulos(dia20.body)).toEqual(['Dois Dias']);

    const dia21 = await request(app).get('/atividades?dia=2026-10-21').set('X-Usuario', 'p-carla');
    expect(titulos(dia21.body)).toEqual(['Outro Dia']);
  });

  it('combina dia e tipo', async () => {
    await request(app).post('/_teste/reset').expect(204);

    await criar(app, palestra('M1 na 19', 'sala-101', '2026-10-19T09:00:00-03:00', '2026-10-19T10:00:00-03:00'));
    await criar(
      app,
      minicurso('M2 na 19/20', 'lab-3', [
        { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' },
        { inicio: '2026-10-20T11:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }
      ])
    );

    const combMinicurso = await request(app).get('/atividades?dia=2026-10-19&tipo=minicurso').set('X-Usuario', 'p-carla');
    expect(titulos(combMinicurso.body)).toEqual(['M2 na 19/20']);

    const combPalestra = await request(app).get('/atividades?dia=2026-10-19&tipo=palestra').set('X-Usuario', 'p-carla');
    expect(titulos(combPalestra.body)).toEqual(['M1 na 19']);
  });

  it('atividade com encontros em dias diferentes aparece ao consultar qualquer um dos dias', async () => {
    await request(app).post('/_teste/reset').expect(204);

    const criada = await criar(
      app,
      minicurso('Dias Alas', 'lab-3', [
        { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
        { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
      ])
    );

    const dia19 = await request(app).get('/atividades?dia=2026-10-19').set('X-Usuario', 'p-carla');
    expect(dia19.body.map((a) => a.id)).toContain(criada.id);

    const dia20 = await request(app).get('/atividades?dia=2026-10-20').set('X-Usuario', 'p-carla');
    expect(dia20.body.map((a) => a.id)).toContain(criada.id);
  });
});