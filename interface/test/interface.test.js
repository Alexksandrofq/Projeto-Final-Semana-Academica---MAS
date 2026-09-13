const fs = require('fs');
const path = require('path');

const { criarPainel } = require('../js/app');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const MAIN = HTML.match(/<main[\s\S]*?<\/main>/)[0];

const ATIVIDADE = {
  id: 'atv_1a2b3c4d',
  titulo: 'Flutter do zero',
  tipo: 'minicurso',
  salaId: 'lab-3',
  vagas: 20,
  encontros: [
    {
      id: 'enc_5e6f7a8b',
      inicio: '2026-10-19T19:00:00-03:00',
      fim: '2026-10-19T22:00:00-03:00'
    }
  ],
  cargaHorariaMinutos: 180,
  situacao: 'prevista',
  ocupadas: 0,
  vagasRestantes: 20,
  emEspera: 0
};

const SALAS = [
  { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
  { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
  { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
];

function respostaFake(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo
  };
}

function criarApiFake(handler) {
  const chamadas = [];
  const apiFake = async (url, opcoes = {}) => {
    const chamada = {
      url: String(url),
      method: (opcoes.method || 'GET').toUpperCase(),
      opcoes
    };
    chamadas.push(chamada);
    return handler(chamada);
  };
  apiFake.chamadas = chamadas;
  return apiFake;
}

const API_404 = () => respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });

function criarResposta(handler) {
  return criarApiFake((chamada) => {
    if (chamada.url.startsWith('http://api-fake.test/atividades/')) {
      return respostaFake(200, ATIVIDADE);
    }
    if (chamada.url === 'http://api-fake.test/atividades' && chamada.method === 'POST') {
      return respostaFake(201, ATIVIDADE);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [ATIVIDADE]);
    }
    if (chamada.url === 'http://api-fake.test/salas') {
      return respostaFake(200, SALAS);
    }
    return handler ? handler(chamada) : API_404();
  });
}

function aguardar() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = MAIN;
});

function montarPainel(apiFake) {
  return criarPainel({ document, fetch: apiFake, enderecoApi: 'http://api-fake.test' });
}

function preencherFormulario() {
  document.getElementById('campo-titulo').value = 'Flutter do zero';
  document.getElementById('campo-tipo').value = 'palestra';
  document.getElementById('campo-sala').value = 'sala-101';
  document.getElementById('campo-vagas').value = '20';
  const entradas = document.querySelector('#lista-encontros .linha-encontro').querySelectorAll('input');
  entradas[0].value = '2026-10-19T19:00';
  entradas[1].value = '2026-10-19T20:00';
}

test('renderiza a grade com as atividades retornadas pela API fake', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await painel.carregarAtividades();
  await aguardar();

  const cartoes = document.querySelectorAll('#lista-atividades .cartao');
  expect(cartoes.length).toBe(1);
  expect(cartoes[0].textContent).toContain('Flutter do zero');
  expect(cartoes[0].textContent).toContain('Minicurso');
});

test('filtro por dia e tipo envia os parâmetros na URL', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await aguardar();
  apiFake.chamadas.length = 0;

  document.getElementById('filtro-dia').value = '2026-10-19';
  document.getElementById('filtro-tipo').value = 'minicurso';
  document.getElementById('filtro-tipo').dispatchEvent(new Event('change'));
  await aguardar();

  const ultima = apiFake.chamadas[apiFake.chamadas.length - 1];
  expect(ultima.method).toBe('GET');
  expect(ultima.url).toBe('http://api-fake.test/atividades?dia=2026-10-19&tipo=minicurso');
});

test('abre os detalhes da atividade ao clicar em "Ver detalhes"', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await painel.carregarAtividades();
  await aguardar();

  document.querySelector('.ver-detalhes').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  expect(document.getElementById('detalhes').hidden).toBe(false);
  expect(document.getElementById('detalhes-titulo').textContent).toBe('Flutter do zero');
  const chamada = apiFake.chamadas.find(
    (c) => c.url === 'http://api-fake.test/atividades/atv_1a2b3c4d'
  );
  expect(chamada).toBeDefined();
  expect(chamada.method).toBe('GET');
  expect(chamada.opcoes.headers['X-Usuario']).toBe('p-carla');
});

test('cria uma atividade com sucesso e mostra a confirmação', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await painel.abrirCriacao();
  await aguardar();
  preencherFormulario();

  await painel.enviarCriacao({ preventDefault() {} });
  await aguardar();

  const chamada = apiFake.chamadas.find(
    (c) => c.method === 'POST' && c.url === 'http://api-fake.test/atividades'
  );
  expect(chamada).toBeDefined();
  expect(chamada.opcoes.headers['Content-Type']).toBe('application/json');
  const corpo = JSON.parse(chamada.opcoes.body);
  expect(corpo.titulo).toBe('Flutter do zero');
  expect(corpo.tipo).toBe('palestra');
  expect(corpo.salaId).toBe('sala-101');
  expect(corpo.vagas).toBe(20);
  expect(corpo.encontros[0].inicio).toBe('2026-10-19T19:00:00-03:00');
  expect(corpo.encontros[0].fim).toBe('2026-10-19T20:00:00-03:00');

  const confirmacao = document.getElementById('confirmacao-criacao');
  expect(confirmacao.hidden).toBe(false);
  expect(confirmacao.textContent).toContain('Flutter do zero');
  expect(confirmacao.textContent).toContain('Prevista');
});

test('mostra a mensagem retornada pela API quando a criação falha', async () => {
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(422, {
        erro: 'DADOS_INVALIDOS',
        mensagem: 'Campo "encontros" é obrigatório.'
      });
    }
    return API_404();
  });
  const painel = montarPainel(apiFake);
  await painel.abrirCriacao();
  await aguardar();
  preencherFormulario();

  await painel.enviarCriacao({ preventDefault() {} });
  await aguardar();

  const status = document.getElementById('status-criacao');
  expect(status.className).toBe('status erro');
  expect(status.textContent).toBe('Campo "encontros" é obrigatório.');
});

test('GET /salas: URL, método, X-Usuario e opções renderizadas', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await painel.abrirCriacao();
  await aguardar();

  const chamada = apiFake.chamadas.find((c) => c.url === 'http://api-fake.test/salas');
  expect(chamada).toBeDefined();
  expect(chamada.method).toBe('GET');
  expect(chamada.opcoes.headers['X-Usuario']).toBe('p-carla');

  const opcoes = document.querySelectorAll('#campo-sala option');
  expect(opcoes.length).toBe(SALAS.length);
  expect(opcoes[0].value).toBe('auditorio');
  expect(opcoes[1].value).toBe('sala-101');
  expect(opcoes[1].textContent).toContain('Sala 101');
});

test('mostra a mensagem da API quando a grade falha ao carregar', async () => {
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(500, {
        erro: 'ERRO_INTERNO',
        mensagem: 'Problema temporário ao carregar as atividades.'
      });
    }
    return API_404();
  });
  const painel = montarPainel(apiFake);
  await painel.carregarAtividades();
  await aguardar();

  const status = document.getElementById('status');
  expect(status.className).toBe('status erro');
  expect(status.textContent).toBe('Problema temporário ao carregar as atividades.');
  expect(document.querySelectorAll('#lista-atividades .cartao').length).toBe(0);
});

test('envia o cabeçalho X-Usuario nas requisições', async () => {
  const apiFake = criarResposta();
  const painel = montarPainel(apiFake);
  await aguardar();

  document.getElementById('filtro-usuario').value = 'p-diego';
  document.getElementById('filtro-usuario').dispatchEvent(new Event('change'));
  await aguardar();

  const chamada = apiFake.chamadas.filter(
    (c) => c.method === 'GET' && c.url === 'http://api-fake.test/atividades'
  ).at(-1);
  expect(chamada.opcoes.headers['X-Usuario']).toBe('p-diego');

  await painel.abrirCriacao();
  await aguardar();
  preencherFormulario();
  await painel.enviarCriacao({ preventDefault() {} });
  await aguardar();

  const post = apiFake.chamadas.find(
    (c) => c.method === 'POST' && c.url === 'http://api-fake.test/atividades'
  );
  expect(post.opcoes.headers['X-Usuario']).toBe('p-diego');
});