const fs = require('fs');
const path = require('path');

const { criarPainel } = require('../js/app');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const MAIN = HTML.match(/<main[\s\S]*?<\/main>/)[0];

function baseAtividade(sobre = {}) {
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
    emEspera: 0,
    ...sobre
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

function montarPainel(apiFake) {
  return criarPainel({ document, fetch: apiFake, enderecoApi: 'http://api-fake.test' });
}

// Fake padrão: atividade livre, sem inscrição -> detalhe mostra Inscrever-se
function fakeDetalheSemInscricao(atividade = baseAtividade()) {
  return criarApiFake((chamada) => {
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
}

test('detalhe mostra "Inscrever-se" com vagas livres (contrato: vagasRestantes)', async () => {
  const apiFake = fakeDetalheSemInscricao(baseAtividade({ vagasRestantes: 2 }));
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  const botao = document.getElementById('botao-inscrever');
  expect(botao).not.toBeNull();
  expect(botao.textContent).toBe('Inscrever-se');
});

test('detalhe mostra "Entrar na fila de espera" quando lotada (vagasRestantes 0)', async () => {
  const apiFake = fakeDetalheSemInscricao(baseAtividade({ vagasRestantes: 0, ocupadas: 2 }));
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes('atv_1a2b3c4d');
  await aguardar();

  const botao = document.getElementById('botao-inscrever');
  expect(botao).not.toBeNull();
  expect(botao.textContent).toBe('Entrar na fila de espera');
});

test('inscrição com sucesso (confirmada): POST exato e botão vira Cancelar', async () => {
  const atividade = baseAtividade({ vagasRestantes: 2 });
  const inscConfirmada = {
    id: 'ins_11111111',
    atividadeId: atividade.id,
    participanteId: 'p-carla',
    status: 'confirmada',
    posicaoNaEspera: null,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:00:00-03:00'
  };
  let inscrita = false;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url === `http://api-fake.test/atividades/${atividade.id}/inscricoes`) {
      inscrita = true;
      return respostaFake(201, inscConfirmada);
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, inscrita ? [inscConfirmada] : []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();

  const botao = document.getElementById('botao-inscrever');
  expect(botao.textContent).toBe('Inscrever-se');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const post = apiFake.chamadas.find((c) => c.method === 'POST' && c.url.endsWith('/inscricoes'));
  expect(post).toBeDefined();
  expect(post.opcoes.headers['X-Usuario']).toBe('p-carla');
  // sem corpo na entrada (contrato M2)
  expect(post.opcoes.body).toBeUndefined();

  await aguardar();
  const cancelar = document.getElementById('botao-cancelar-inscricao');
  expect(cancelar).not.toBeNull();
  expect(cancelar.textContent).toBe('Cancelar inscrição');
  const status = document.getElementById('status-inscricao');
  expect(status.textContent).toContain('Confirmado');
});

test('inscrição indo para espera: mostra posição da fila', async () => {
  const atividade = baseAtividade({ vagasRestantes: 0, ocupadas: 2, emEspera: 2 });
  const inscEspera = {
    id: 'ins_22222222',
    atividadeId: atividade.id,
    participanteId: 'p-carla',
    status: 'em_espera',
    posicaoNaEspera: 3,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:00:00-03:00'
  };
  let inscrita = false;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url === `http://api-fake.test/atividades/${atividade.id}/inscricoes`) {
      inscrita = true;
      return respostaFake(201, inscEspera);
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, inscrita ? [inscEspera] : []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();

  expect(document.getElementById('botao-inscrever').textContent).toBe('Entrar na fila de espera');
  document.getElementById('botao-inscrever').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  await aguardar();

  const status = document.getElementById('status-inscricao');
  expect(status.textContent).toContain('Na espera');
  expect(status.textContent).toContain('3º na fila');
});

test('loading desabilita o botão para evitar duplo clique', async () => {
  const atividade = baseAtividade();
  let resolverPost;
  const trava = new Promise((resolve) => {
    resolverPost = resolve;
  });
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url.endsWith('/inscricoes')) {
      return trava.then(() => respostaFake(201, {
        id: 'ins_33333333',
        atividadeId: atividade.id,
        participanteId: 'p-carla',
        status: 'confirmada',
        posicaoNaEspera: null,
        convocadaAte: null,
        criadaEm: '2026-10-13T09:00:00-03:00'
      }));
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();

  const botao = document.getElementById('botao-inscrever');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  // enquanto a chamada está em andamento, desabilitado
  expect(botao.disabled).toBe(true);
  expect(botao.textContent).toBe('Enviando…');
  resolverPost();
  await aguardar();
  await aguardar();
});

test('cancelamento exige confirmação em dois cliques (evita acidental)', async () => {
  const atividade = baseAtividade();
  const insc = {
    id: 'ins_44444444',
    atividadeId: atividade.id,
    participanteId: 'p-carla',
    status: 'confirmada',
    posicaoNaEspera: null,
    convocadaAte: null,
    criadaEm: '2026-10-13T09:00:00-03:00'
  };
  let cancelada = false;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url === `http://api-fake.test/inscricoes/${insc.id}/cancelamento`) {
      cancelada = true;
      return respostaFake(200, { ...insc, status: 'cancelada' });
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, cancelada ? [] : [insc]);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();

  let botao = document.getElementById('botao-cancelar-inscricao');
  expect(botao).not.toBeNull();
  // 1º clique: só arma, não chama API
  const postsAntes = apiFake.chamadas.filter((c) => c.method === 'POST' && c.url.includes('/cancelamento')).length;
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  expect(botao.textContent).toBe('Confirmar cancelamento');
  expect(apiFake.chamadas.filter((c) => c.method === 'POST' && c.url.includes('/cancelamento')).length).toBe(postsAntes);
  // 2º clique: efetiva
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  await aguardar();
  const post = apiFake.chamadas.find((c) => c.method === 'POST' && c.url === `http://api-fake.test/inscricoes/${insc.id}/cancelamento`);
  expect(post).toBeDefined();
  expect(post.opcoes.headers['X-Usuario']).toBe('p-carla');
  // após cancelar, volta a mostrar Inscrever-se
  expect(document.getElementById('botao-inscrever')).not.toBeNull();
});

// ---------- Minhas inscrições ----------

function fakeMinhas(inscricoes, atividades) {
  const mapa = {};
  for (const a of atividades) {
    mapa[a.id] = a;
  }
  return criarApiFake((chamada) => {
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/inscricoes') {
      return respostaFake(200, inscricoes);
    }
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, atividades);
    }
    if (chamada.method === 'GET' && chamada.url.startsWith('http://api-fake.test/atividades/')) {
      const id = chamada.url.split('/').pop();
      if (mapa[id]) {
        return respostaFake(200, mapa[id]);
      }
      return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'Atividade não encontrada.' });
    }
    if (chamada.method === 'POST' && chamada.url.includes('/cancelamento')) {
      const id = chamada.url.split('/')[4];
      const alvo = inscricoes.find((i) => i.id === id);
      const atualizada = { ...alvo, status: 'cancelada', posicaoNaEspera: null, convocadaAte: null };
      return respostaFake(200, atualizada);
    }
    if (chamada.method === 'POST' && chamada.url.includes('/confirmacao')) {
      const id = chamada.url.split('/')[4];
      const alvo = inscricoes.find((i) => i.id === id);
      return respostaFake(200, { ...alvo, status: 'confirmada', convocadaAte: null });
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'não encontrado' });
  });
}

test('minhas inscrições: mostra nome, horário e visual distinto por status', async () => {
  const atv = baseAtividade();
  const futuro = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const inscricoes = [
    { id: 'ins_c1', atividadeId: atv.id, participanteId: 'p-carla', status: 'confirmada', posicaoNaEspera: null, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' },
    { id: 'ins_c2', atividadeId: atv.id, participanteId: 'p-carla', status: 'em_espera', posicaoNaEspera: 3, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' },
    { id: 'ins_c3', atividadeId: atv.id, participanteId: 'p-carla', status: 'convocada', posicaoNaEspera: null, convocadaAte: futuro, criadaEm: '2026-10-13T09:00:00-03:00' },
    { id: 'ins_c4', atividadeId: atv.id, participanteId: 'p-carla', status: 'cancelada', posicaoNaEspera: null, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' },
    { id: 'ins_c5', atividadeId: atv.id, participanteId: 'p-carla', status: 'expirada', posicaoNaEspera: null, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' }
  ];
  const apiFake = fakeMinhas(inscricoes, [atv]);
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();
  await aguardar();

  const cartoes = document.querySelectorAll('#lista-inscricoes .cartao-inscricao');
  expect(cartoes.length).toBe(5);
  // nome + horário da atividade (contrato: titulo + encontros)
  expect(cartoes[0].textContent).toContain('Flutter do zero');
  expect(cartoes[0].textContent).toContain('19/10/2026');

  const porStatus = {};
  for (const c of cartoes) {
    const el = c.querySelector('[data-status]');
    porStatus[el.dataset.status] = c;
  }
  expect(porStatus.confirmada.textContent).toContain('Confirmado');
  expect(porStatus.confirmada.querySelector('[data-status]').className).toContain('status-confirmada');
  expect(porStatus.em_espera.textContent).toContain('3º na fila');
  expect(porStatus.em_espera.querySelector('[data-status]').className).toContain('status-em-espera');
  expect(porStatus.convocada.textContent).toContain('Convocado');
  expect(porStatus.convocada.querySelector('[data-status]').className).toContain('status-convocada');
  expect(porStatus.cancelada.querySelector('[data-status]').className).toContain('status-cancelada');
  expect(porStatus.expirada.querySelector('[data-status]').className).toContain('status-expirada');

  // cancelar disponível em ativo (confirmada e espera), ausente em inativo
  expect(porStatus.confirmada.querySelector('.cancelar-inscricao')).not.toBeNull();
  expect(porStatus.em_espera.querySelector('.cancelar-inscricao')).not.toBeNull();
  expect(porStatus.convocada.querySelector('.cancelar-inscricao')).not.toBeNull();
  expect(porStatus.cancelada.querySelector('.cancelar-inscricao')).toBeNull();
  expect(porStatus.expirada.querySelector('.cancelar-inscricao')).toBeNull();
  // confirmar só em convocada
  expect(porStatus.convocada.querySelector('.confirmar-vaga')).not.toBeNull();
  expect(porStatus.confirmada.querySelector('.confirmar-vaga')).toBeNull();
});

test('convocado: contagem regressiva usa convocadaAte e atualiza em tempo real', async () => {
  const atv = baseAtividade();
  const futuro = new Date(Date.now() + (1 * 3600 + 20 * 60 + 10) * 1000).toISOString();
  const insc = { id: 'ins_conv', atividadeId: atv.id, participanteId: 'p-carla', status: 'convocada', posicaoNaEspera: null, convocadaAte: futuro, criadaEm: '2026-10-13T09:00:00-03:00' };
  const apiFake = fakeMinhas([insc], [atv]);
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();
  await aguardar();

  const contagem = document.querySelector('[data-convocada-ate]');
  expect(contagem).not.toBeNull();
  expect(contagem.dataset.convocadaAte).toBe(futuro);
  expect(contagem.textContent).toContain('Expira em');
  expect(contagem.textContent).toMatch(/h/);
  const textoAntes = contagem.textContent;

  // avança o relógio 60s e atualiza sem recarregar a página
  const agoraReal = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(agoraReal + 60 * 1000);
  painel.atualizarContagens();
  const textoDepois = document.querySelector('[data-convocada-ate]').textContent;
  expect(textoDepois).toContain('Expira em');
  expect(textoDepois).not.toBe(textoAntes);

  // prazo estourado -> botão desabilita e texto vira expirado
  jest.spyOn(Date, 'now').mockReturnValue(new Date(futuro).getTime() + 1000);
  painel.atualizarContagens();
  expect(document.querySelector('[data-convocada-ate]').textContent).toBe('Prazo expirado');
  expect(document.querySelector('.confirmar-vaga').disabled).toBe(true);
});

test('minhas vazio: mensagem clara + atalho para a grade', async () => {
  const apiFake = fakeMinhas([], [baseAtividade()]);
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();

  expect(document.getElementById('status-minhas').textContent).toBe('Você ainda não tem inscrições.');
  const link = document.getElementById('link-grade');
  expect(link).not.toBeNull();
  expect(link.textContent).toBe('Ver grade de atividades');
  link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  expect(document.getElementById('grade').hidden).toBe(false);
  expect(document.getElementById('minhas-inscricoes').hidden).toBe(true);
});

test('minhas erro ao carregar: mostra mensagem da API + tentar novamente', async () => {
  let tentativas = 0;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.url === 'http://api-fake.test/inscricoes') {
      tentativas += 1;
      if (tentativas === 1) {
        return respostaFake(500, { erro: 'ERRO', mensagem: 'API fora do ar, tente mais tarde.' });
      }
      return respostaFake(200, []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [baseAtividade()]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();

  const status = document.getElementById('status-minhas');
  expect(status.className).toBe('status erro');
  expect(status.textContent).toBe('API fora do ar, tente mais tarde.');
  const retry = document.getElementById('botao-tentar-minhas');
  expect(retry.hidden).toBe(false);
  retry.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  expect(document.getElementById('status-minhas').textContent).toBe('Você ainda não tem inscrições.');
});

// ---------- códigos de erro do POST inscrição ----------

const ERROS_INSCRICAO = [
  ['ATIVIDADE_CANCELADA', 422, 'Atividade cancelada, escolha outra.'],
  ['INSCRICOES_ENCERRADAS', 422, 'Inscrições encerradas para esta atividade.'],
  ['JA_INSCRITO', 409, 'Você já está inscrito nesta atividade.'],
  ['CONFLITO_DE_HORARIO', 409, 'Conflito de horário com outra inscrição.'],
  ['LIMITE_DE_MINICURSOS', 422, 'Limite de 3 minicursos por participante.'],
  ['SOMENTE_PARTICIPANTE', 403, 'Apenas participante pode se inscrever.'],
  ['NAO_ENCONTRADO', 404, 'Atividade não encontrada.']
];

test.each(ERROS_INSCRICAO)('inscrever mostra mensagem da API para %s', async (codigo, statusHTTP, mensagem) => {
  const atividade = baseAtividade();
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url.endsWith('/inscricoes')) {
      return respostaFake(statusHTTP, { erro: codigo, mensagem });
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, []);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();
  document.getElementById('botao-inscrever').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const status = document.getElementById('status-inscricao');
  expect(status.className).toBe('status erro');
  expect(status.textContent).toBe(mensagem);
  expect(status.dataset.erro).toBe(codigo);
});

// ---------- códigos de erro do cancelamento ----------

const ERROS_CANCEL = [
  ['INSCRICAO_INATIVA', 422, 'Inscrição já está inativa.'],
  ['ATIVIDADE_JA_INICIADA', 422, 'Atividade já iniciada, não pode cancelar.'],
  ['NAO_ENCONTRADO', 404, 'Inscrição não encontrada.']
];

test.each(ERROS_CANCEL)('cancelar mostra mensagem da API para %s', async (codigo, statusHTTP, mensagem) => {
  const atividade = baseAtividade();
  const insc = { id: 'ins_99990000', atividadeId: atividade.id, participanteId: 'p-carla', status: 'confirmada', posicaoNaEspera: null, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' };
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'POST' && chamada.url.includes('/cancelamento')) {
      return respostaFake(statusHTTP, { erro: codigo, mensagem });
    }
    if (chamada.url === `http://api-fake.test/atividades/${atividade.id}`) {
      return respostaFake(200, atividade);
    }
    if (chamada.url.startsWith('http://api-fake.test/inscricoes?atividadeId=')) {
      return respostaFake(200, [insc]);
    }
    if (chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atividade]);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirDetalhes(atividade.id);
  await aguardar();
  const botao = document.getElementById('botao-cancelar-inscricao');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const status = document.getElementById('status-inscricao');
  expect(status.className).toBe('status erro');
  expect(status.textContent).toBe(mensagem);
  expect(status.dataset.erro).toBe(codigo);
});

// ---------- códigos de erro da confirmação ----------

const ERROS_CONFIRM = [
  ['SEM_CONVOCACAO', 422, 'Inscrição não está convocada.'],
  ['CONVOCACAO_EXPIRADA', 422, 'Prazo de convocação expirado.'],
  ['CONFLITO_DE_HORARIO', 409, 'Conflito de horário ao confirmar.'],
  ['LIMITE_DE_MINICURSOS', 422, 'Limite de 3 minicursos ao confirmar.']
];

test.each(ERROS_CONFIRM)('confirmar mostra mensagem da API para %s', async (codigo, statusHTTP, mensagem) => {
  const atv = baseAtividade();
  const futuro = new Date(Date.now() + 3600 * 1000).toISOString();
  const insc = { id: 'ins_conf9', atividadeId: atv.id, participanteId: 'p-carla', status: 'convocada', posicaoNaEspera: null, convocadaAte: futuro, criadaEm: '2026-10-13T09:00:00-03:00' };
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/inscricoes') {
      return respostaFake(200, [insc]);
    }
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atv]);
    }
    if (chamada.method === 'POST' && chamada.url.includes('/confirmacao')) {
      return respostaFake(statusHTTP, { erro: codigo, mensagem });
    }
    if (chamada.url.startsWith('http://api-fake.test/atividades/')) {
      return respostaFake(200, atv);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();
  await aguardar();

  document.querySelector('.confirmar-vaga').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();

  const erroLinha = document.querySelector('[data-papel="erro-inscricao"]');
  expect(erroLinha.textContent).toBe(mensagem);
  expect(erroLinha.dataset.erro).toBe(codigo);
});

test('confirmar vaga com sucesso vira confirmada', async () => {
  const atv = baseAtividade();
  const futuro = new Date(Date.now() + 3600 * 1000).toISOString();
  const insc = { id: 'ins_ok1', atividadeId: atv.id, participanteId: 'p-carla', status: 'convocada', posicaoNaEspera: null, convocadaAte: futuro, criadaEm: '2026-10-13T09:00:00-03:00' };
  let confirmada = false;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/inscricoes') {
      return respostaFake(200, confirmada ? [{ ...insc, status: 'confirmada', convocadaAte: null }] : [insc]);
    }
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atv]);
    }
    if (chamada.method === 'POST' && chamada.url.includes('/confirmacao')) {
      confirmada = true;
      return respostaFake(200, { ...insc, status: 'confirmada', convocadaAte: null });
    }
    if (chamada.url.startsWith('http://api-fake.test/atividades/')) {
      return respostaFake(200, atv);
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();
  await aguardar();

  document.querySelector('.confirmar-vaga').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  await aguardar();

  const estado = document.querySelector('[data-status]');
  expect(estado.dataset.status).toBe('confirmada');
  expect(estado.textContent).toContain('Confirmado');
});

test('cancelar em Minhas inscrições também pede confirmação em dois cliques', async () => {
  const atv = baseAtividade();
  const insc = { id: 'ins_m2c', atividadeId: atv.id, participanteId: 'p-carla', status: 'em_espera', posicaoNaEspera: 1, convocadaAte: null, criadaEm: '2026-10-13T09:00:00-03:00' };
  let posts = 0;
  let cancelada = false;
  const apiFake = criarApiFake((chamada) => {
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/inscricoes') {
      return respostaFake(200, cancelada ? [] : [insc]);
    }
    if (chamada.method === 'GET' && chamada.url === 'http://api-fake.test/atividades') {
      return respostaFake(200, [atv]);
    }
    if (chamada.method === 'POST' && chamada.url.includes('/cancelamento')) {
      posts += 1;
      cancelada = true;
      return respostaFake(200, { ...insc, status: 'cancelada' });
    }
    return respostaFake(404, { erro: 'NAO_ENCONTRADO', mensagem: 'x' });
  });
  const painel = montarPainel(apiFake);
  await painel.abrirMinhasInscricoes();
  await aguardar();
  await aguardar();

  const botao = document.querySelector('.cancelar-inscricao');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  expect(posts).toBe(0);
  expect(botao.textContent).toBe('Confirmar cancelamento');
  botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await aguardar();
  await aguardar();
  expect(posts).toBe(1);
});
