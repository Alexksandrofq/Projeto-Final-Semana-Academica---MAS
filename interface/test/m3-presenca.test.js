const fs = require('fs');
const path = require('path');

const { criarPainel } = require('../js/app');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const MAIN = HTML.match(/<main[\s\S]*?<\/main>/)[0];

function baseAtividade() {
  return {
    id: 'atv_1a2b3c4d',
    titulo: 'Flutter do zero',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 2,
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
    vagasRestantes: 2,
    emEspera: 0
  };
}

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

function aguardar(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  document.body.innerHTML = MAIN;
  jest.restoreAllMocks();
});

function montarPainel(apiFake, usuario = 'p-carla') {
  const painel = criarPainel({ document, fetch: apiFake, enderecoApi: 'http://api-fake.test' });
  document.getElementById('filtro-usuario').value = usuario;
  return painel;
}

test('organização obtém código QR do encontro com sucesso', async () => {
  const atividade = baseAtividade();
  const codigoDoEncontro = {
    encontroId: 'enc_5e6f7a8b',
    codigo: 'K7M2QX',
    trocaEm: '2026-10-19T19:01:00-03:00',
    validoAte: '2026-10-19T19:02:00-03:00'
  };
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/atividades/atv_1a2b3c4d') {
      return respostaFake(200, atividade);
    }
    if (chamada.url === 'http://api-fake.test/encontros/enc_5e6f7a8b/codigo') {
      return respostaFake(200, codigoDoEncontro);
    }
    if (chamada.url === 'http://api-fake.test/inscricoes?atividadeId=atv_1a2b3c4d') {
      return respostaFake(200, []);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake, 'org-ana');
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  const botao = document.getElementById('botao-obter-codigo-enc_5e6f7a8b');
  expect(botao).not.toBeNull();
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const info = document.getElementById('info-codigo-enc_5e6f7a8b');
  expect(info.textContent).toContain('K7M2QX');
});

test('participante registra presença online com sucesso', async () => {
  const atividade = baseAtividade();
  const presencaCriada = {
    id: 'pre_11111111',
    encontroId: 'enc_5e6f7a8b',
    participanteId: 'p-carla',
    origem: 'qr',
    lidoEm: '2026-10-19T19:00:00-03:00',
    registradaEm: '2026-10-19T19:00:00-03:00',
    justificativa: null
  };
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/atividades/atv_1a2b3c4d') {
      return respostaFake(200, atividade);
    }
    if (chamada.method === 'POST' && chamada.url === 'http://api-fake.test/encontros/enc_5e6f7a8b/presencas') {
      return respostaFake(201, presencaCriada);
    }
    if (chamada.url === 'http://api-fake.test/inscricoes?atividadeId=atv_1a2b3c4d') {
      return respostaFake(200, []);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake, 'p-carla');
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  const inputCodigo = document.getElementById('codigo-presenca-enc_5e6f7a8b');
  inputCodigo.value = 'K7M2QX';
  const botao = document.getElementById('botao-registrar-presenca-enc_5e6f7a8b');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const status = document.getElementById('status-presenca-enc_5e6f7a8b');
  expect(status.textContent).toContain('Presença registrada com sucesso');
  expect(status.textContent).toContain('pre_11111111');
});

test('organização registra presença manual com sucesso', async () => {
  const atividade = baseAtividade();
  const presencaManual = {
    id: 'pre_22222222',
    encontroId: 'enc_5e6f7a8b',
    participanteId: 'p-carla',
    origem: 'manual',
    lidoEm: '2026-10-19T19:00:00-03:00',
    registradaEm: '2026-10-19T19:00:00-03:00',
    justificativa: 'Participante estava sem bateria no celular.'
  };
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/atividades/atv_1a2b3c4d') {
      return respostaFake(200, atividade);
    }
    if (chamada.method === 'POST' && chamada.url === 'http://api-fake.test/encontros/enc_5e6f7a8b/presencas/manual') {
      return respostaFake(201, presencaManual);
    }
    if (chamada.url === 'http://api-fake.test/inscricoes?atividadeId=atv_1a2b3c4d') {
      return respostaFake(200, []);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake, 'org-ana');
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  document.getElementById('manual-participante-enc_5e6f7a8b').value = 'p-carla';
  document.getElementById('manual-justificativa-enc_5e6f7a8b').value = 'Participante estava sem bateria no celular.';
  const botao = document.getElementById('botao-manual-enc_5e6f7a8b');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const status = document.getElementById('status-manual-enc_5e6f7a8b');
  expect(status.textContent).toContain('Presença manual lançada');
});

test('organização lista presenças do encontro com sucesso', async () => {
  const atividade = baseAtividade();
  const presencaList = [
    {
      id: 'pre_11111111',
      encontroId: 'enc_5e6f7a8b',
      participanteId: 'p-carla',
      origem: 'qr',
      lidoEm: '2026-10-19T19:00:00-03:00',
      registradaEm: '2026-10-19T19:00:00-03:00',
      justificativa: null
    }
  ];
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/atividades/atv_1a2b3c4d') {
      return respostaFake(200, atividade);
    }
    if (chamada.url === 'http://api-fake.test/encontros/enc_5e6f7a8b/presencas') {
      return respostaFake(200, presencaList);
    }
    if (chamada.url === 'http://api-fake.test/inscricoes?atividadeId=atv_1a2b3c4d') {
      return respostaFake(200, []);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake, 'org-ana');
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  const botao = document.getElementById('botao-listar-presencas-enc_5e6f7a8b');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const lista = document.getElementById('lista-presencas-enc_5e6f7a8b');
  expect(lista.textContent).toContain('p-carla');
  expect(lista.textContent).toContain('qr');
});
