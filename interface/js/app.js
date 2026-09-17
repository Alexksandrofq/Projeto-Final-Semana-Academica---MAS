/* Semana Acadêmica — grade de atividades (M1) */

const USUARIOS_CONTRATO = [
  'org-ana',
  'org-bruno',
  'p-carla',
  'p-diego',
  'p-elisa',
  'p-fabio',
  'p-gabriela',
  'p-heitor',
  'p-isadora',
  'p-joao'
];

const ROTULO_TIPO = {
  palestra: 'Palestra',
  minicurso: 'Minicurso'
};

const ROTULO_SITUACAO = {
  prevista: 'Prevista',
  em_andamento: 'Em andamento',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada'
};

const ROTULO_STATUS_INSCRICAO = {
  confirmada: 'Confirmado (vaga garantida)',
  em_espera: 'Na espera',
  convocada: 'Convocado',
  cancelada: 'Cancelado',
  expirada: 'Perdeu a vaga'
};

const STATUS_ATIVOS_INSCRICAO = ['confirmada', 'em_espera', 'convocada'];

function formatarPosicaoEspera(posicao) {
  return `${posicao}º na fila`;
}

function formatarContagemRegressiva(msRestantes) {
  if (msRestantes <= 0) {
    return 'prazo expirado';
  }
  const totalSegundos = Math.floor(msRestantes / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${horas}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}

async function lerCorpoErro(resposta) {
  try {
    return await resposta.json();
  } catch (_) {
    return null;
  }
}

function mensagemDeErro(corpo, statusHTTP) {
  if (corpo && corpo.mensagem) {
    return corpo.mensagem;
  }
  if (statusHTTP) {
    return `Erro ${statusHTTP} ao acessar a API.`;
  }
  return 'Não foi possível acessar a API.';
}

function formatarDataEHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatarCargaHoraria(minutos) {
  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;
  return `${horas}h${String(restantes).padStart(2, '0')}`;
}

function horarioLocalParaBrasilia(valor) {
  if (!valor) {
    return valor;
  }
  return `${valor}:00-03:00`;
}

function vagasParaNumber(valor) {
  if (valor === '') {
    return valor;
  }
  const numero = Number(valor);
  if (Number.isNaN(numero)) {
    return valor;
  }
  return numero;
}

function criarPainel({ document: doc, fetch: buscar, enderecoApi } = {}) {
  const document = doc || globalThis.document;
  const fetch = buscar || globalThis.fetch;
  const ENDERECO_API = enderecoApi || 'http://localhost:3000';

  const seletorUsuario = document.getElementById('filtro-usuario');
  const campoDia = document.getElementById('filtro-dia');
  const seletorTipo = document.getElementById('filtro-tipo');
  const statusEl = document.getElementById('status');
  const listaEl = document.getElementById('lista-atividades');
  const secaoGrade = document.getElementById('grade');
  const secaoDetalhes = document.getElementById('detalhes');
  const botaoVoltar = document.getElementById('botao-voltar');
  const detalhesTitulo = document.getElementById('detalhes-titulo');
  const statusDetalhes = document.getElementById('status-detalhes');
  const conteudoDetalhes = document.getElementById('conteudo-detalhes');
  const botaoNovaAtividade = document.getElementById('botao-nova-atividade');
  const botaoMinhasInscricoes = document.getElementById('botao-minhas-inscricoes');
  const secaoMinhas = document.getElementById('minhas-inscricoes');
  const botaoVoltarMinhas = document.getElementById('botao-voltar-minhas');
  const statusMinhas = document.getElementById('status-minhas');
  const listaInscricoes = document.getElementById('lista-inscricoes');
  const botaoTentarMinhas = document.getElementById('botao-tentar-minhas');
  const secaoCriacao = document.getElementById('criacao');
  const botaoCancelarCriacao = document.getElementById('botao-cancelar-criacao');
  const statusCriacao = document.getElementById('status-criacao');
  const formCriacao = document.getElementById('form-criacao');
  const campoTitulo = document.getElementById('campo-titulo');
  const campoTipo = document.getElementById('campo-tipo');
  const campoSala = document.getElementById('campo-sala');
  const campoVagas = document.getElementById('campo-vagas');
  const listaEncontros = document.getElementById('lista-encontros');
  const botaoAdicionarEncontro = document.getElementById('botao-adicionar-encontro');
  const confirmacaoCriacao = document.getElementById('confirmacao-criacao');
  const botaoEnviarCriacao = document.getElementById('botao-enviar-criacao');

  let atividadeAtualId = null;

  function preencherUsuarios() {
    for (const id of USUARIOS_CONTRATO) {
      const opcao = document.createElement('option');
      opcao.value = id;
      opcao.textContent = id;
      seletorUsuario.appendChild(opcao);
    }
  }

  function parametrosDosFiltros() {
    const params = new URLSearchParams();
    if (campoDia.value) {
      params.set('dia', campoDia.value);
    }
    if (seletorTipo.value) {
      params.set('tipo', seletorTipo.value);
    }
    return params;
  }

  function mostrarEstadoCarregando() {
    statusEl.textContent = 'Carregando atividades…';
    statusEl.className = 'status carregando';
    listaEl.innerHTML = '';
  }

  function mostrarErro(statusHTTP, corpo) {
    if (corpo && corpo.mensagem) {
      statusEl.textContent = corpo.mensagem;
    } else if (statusHTTP) {
      statusEl.textContent = `Erro ${statusHTTP} ao acessar a API.`;
    } else {
      statusEl.textContent = 'Não foi possível acessar a API.';
    }
    statusEl.className = 'status erro';
    listaEl.innerHTML = '';
  }

  function mostrarVazio() {
    statusEl.textContent = 'Nenhuma atividade para os filtros selecionados.';
    statusEl.className = 'status';
    listaEl.innerHTML = '';
  }

  function montarCartao(atividade) {
    const cartao = document.createElement('li');
    cartao.className = 'cartao';

    const titulo = document.createElement('h2');
    titulo.textContent = atividade.titulo;
    cartao.appendChild(titulo);

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = ROTULO_TIPO[atividade.tipo] || atividade.tipo;
    if (atividade.tipo === 'minicurso') {
      tag.classList.add('minicurso');
    }
    cartao.appendChild(tag);

    const classeSituacao = document.createElement('p');
    classeSituacao.className = 'situacao';
    classeSituacao.textContent = ROTULO_SITUACAO[atividade.situacao] || atividade.situacao;
    cartao.appendChild(classeSituacao);

    const detalhes = document.createElement('p');
    detalhes.textContent =
      `Sala: ${atividade.salaId} · Vagas: ${atividade.vagas}` +
      ` · Carga horária: ${formatarCargaHoraria(atividade.cargaHorariaMinutos)}`;
    cartao.appendChild(detalhes);

    const encontros = document.createElement('ul');
    for (const encontro of atividade.encontros) {
      const item = document.createElement('li');
      item.className = 'encontro';
      item.textContent =
        `${formatarDataEHora(encontro.inicio)} – ${formatarDataEHora(encontro.fim)}`;
      encontros.appendChild(item);
    }
    cartao.appendChild(encontros);

    const verDetalhes = document.createElement('button');
    verDetalhes.type = 'button';
    verDetalhes.className = 'ver-detalhes';
    verDetalhes.dataset.id = atividade.id;
    verDetalhes.textContent = 'Ver detalhes';
    cartao.appendChild(verDetalhes);

    return cartao;
  }

  function renderizarLista(atividades) {
    statusEl.textContent = '';
    statusEl.className = 'status';
    listaEl.innerHTML = '';

    if (atividades.length === 0) {
      mostrarVazio();
      return;
    }

    const fragmento = document.createDocumentFragment();
    for (const atividade of atividades) {
      fragmento.appendChild(montarCartao(atividade));
    }
    listaEl.appendChild(fragmento);
  }

  async function carregarAtividades() {
    mostrarEstadoCarregando();

    const params = parametrosDosFiltros();
    const query = params.toString();
    const url = `${ENDERECO_API}/atividades${query ? `?${query}` : ''}`;

    try {
      const resposta = await fetch(url, {
        headers: { 'X-Usuario': seletorUsuario.value }
      });

      if (!resposta.ok) {
        let corpo = null;
        try {
          corpo = await resposta.json();
        } catch (_) {
          corpo = null;
        }
        mostrarErro(resposta.status, corpo);
        return;
      }

      const atividades = await resposta.json();
      renderizarLista(atividades);
    } catch (erro) {
      mostrarErro(null, null);
    }
  }

  function mostrarCarregandoDetalhes() {
    detalhesTitulo.textContent = '';
    statusDetalhes.textContent = 'Carregando atividade…';
    statusDetalhes.className = 'status carregando';
    conteudoDetalhes.innerHTML = '';
  }

  function mostrarErroDetalhes(statusHTTP, corpo) {
    if (corpo && corpo.mensagem) {
      statusDetalhes.textContent = corpo.mensagem;
    } else if (statusHTTP) {
      statusDetalhes.textContent = `Erro ${statusHTTP} ao acessar a API.`;
    } else {
      statusDetalhes.textContent = 'Não foi possível acessar a API.';
    }
    statusDetalhes.className = 'status erro';
    detalhesTitulo.textContent = '';
    conteudoDetalhes.innerHTML = '';
  }

  function renderizarDetalhes(atividade) {
    detalhesTitulo.textContent = atividade.titulo;
    statusDetalhes.textContent = '';
    statusDetalhes.className = 'status';
    conteudoDetalhes.innerHTML = '';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = ROTULO_TIPO[atividade.tipo] || atividade.tipo;
    if (atividade.tipo === 'minicurso') {
      tag.classList.add('minicurso');
    }
    conteudoDetalhes.appendChild(tag);

    const situacao = document.createElement('p');
    situacao.className = 'situacao';
    situacao.textContent =
      `Situação: ${ROTULO_SITUACAO[atividade.situacao] || atividade.situacao}`;
    conteudoDetalhes.appendChild(situacao);

    const sala = document.createElement('p');
    sala.textContent = `Sala: ${atividade.salaId}`;
    conteudoDetalhes.appendChild(sala);

    const vagasInfo = document.createElement('p');
    vagasInfo.textContent =
      `Vagas: ${atividade.vagas} · Ocupadas: ${atividade.ocupadas}` +
      ` · Vagas restantes: ${atividade.vagasRestantes} · Em espera: ${atividade.emEspera}`;
    conteudoDetalhes.appendChild(vagasInfo);

    const carga = document.createElement('p');
    carga.textContent = `Carga horária: ${formatarCargaHoraria(atividade.cargaHorariaMinutos)}`;
    conteudoDetalhes.appendChild(carga);

    const encontros = document.createElement('ul');
    for (const encontro of atividade.encontros) {
      const item = document.createElement('li');
      item.className = 'encontro';
      item.textContent =
        `${formatarDataEHora(encontro.inicio)} – ${formatarDataEHora(encontro.fim)}`;
      encontros.appendChild(item);
    }
    conteudoDetalhes.appendChild(encontros);

    const area = document.createElement('div');
    area.id = 'area-inscricao';
    area.className = 'area-inscricao';
    conteudoDetalhes.appendChild(area);
  }

  function obterAreaInscricao() {
    let area = document.getElementById('area-inscricao');
    if (!area) {
      area = document.createElement('div');
      area.id = 'area-inscricao';
      area.className = 'area-inscricao';
      conteudoDetalhes.appendChild(area);
    }
    return area;
  }

  function mostrarCarregandoInscricaoDetalhe() {
    const area = obterAreaInscricao();
    area.innerHTML = '';
    const info = document.createElement('p');
    info.id = 'status-inscricao';
    info.className = 'status carregando';
    info.setAttribute('role', 'status');
    info.textContent = 'Carregando inscrição…';
    area.appendChild(info);
  }

  function mostrarErroInscricaoDetalhe(statusHTTP, corpo) {
    const area = obterAreaInscricao();
    area.innerHTML = '';
    const info = document.createElement('p');
    info.id = 'status-inscricao';
    info.className = 'status erro';
    info.setAttribute('role', 'status');
    info.textContent = mensagemDeErro(corpo, statusHTTP);
    if (corpo && corpo.erro) {
      info.dataset.erro = corpo.erro;
    }
    area.appendChild(info);
  }

  function rotuloBotaoInscrever(atividade) {
    if (
      atividade &&
      atividade.vagasRestantes !== undefined &&
      atividade.vagasRestantes !== null &&
      Number(atividade.vagasRestantes) <= 0
    ) {
      return 'Entrar na fila de espera';
    }
    return 'Inscrever-se';
  }

  function textoStatusInscricao(inscricao) {
    if (inscricao.status === 'em_espera') {
      const pos = inscricao.posicaoNaEspera;
      if (pos !== undefined && pos !== null) {
        return `Sua inscrição: Na espera — ${formatarPosicaoEspera(pos)}`;
      }
      return 'Sua inscrição: Na espera';
    }
    return `Sua inscrição: ${ROTULO_STATUS_INSCRICAO[inscricao.status] || inscricao.status}`;
  }

  function renderizarAreaInscricaoDetalhe(atividade, minhaInscricao) {
    const area = obterAreaInscricao();
    area.innerHTML = '';

    const info = document.createElement('p');
    info.id = 'status-inscricao';
    info.className = 'status';
    info.setAttribute('role', 'status');
    info.setAttribute('aria-live', 'polite');
    area.appendChild(info);

    if (!minhaInscricao) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.id = 'botao-inscrever';
      botao.className = 'botao botao-inscrever';
      botao.dataset.atividadeId = atividade.id;
      botao.textContent = rotuloBotaoInscrever(atividade);
      area.appendChild(botao);
      return;
    }

    info.textContent = textoStatusInscricao(minhaInscricao);
    info.className = `status status-inscricao status-${minhaInscricao.status.replace('_', '-')}`;
    info.dataset.status = minhaInscricao.status;

    if (minhaInscricao.status === 'convocada' && minhaInscricao.convocadaAte) {
      const contagem = document.createElement('p');
      contagem.className = 'contagem-regressiva';
      contagem.dataset.convocadaAte = minhaInscricao.convocadaAte;
      contagem.textContent = `Expira em ${formatarContagemRegressiva(new Date(minhaInscricao.convocadaAte).getTime() - Date.now())}`;
      area.appendChild(contagem);

      const botaoConfirmar = document.createElement('button');
      botaoConfirmar.type = 'button';
      botaoConfirmar.id = 'botao-confirmar-detalhe';
      botaoConfirmar.className = 'botao confirmar-vaga';
      botaoConfirmar.dataset.id = minhaInscricao.id;
      botaoConfirmar.textContent = 'Confirmar vaga';
      if (new Date(minhaInscricao.convocadaAte).getTime() <= Date.now()) {
        botaoConfirmar.disabled = true;
      }
      area.appendChild(botaoConfirmar);
    }

    const botaoCancelar = document.createElement('button');
    botaoCancelar.type = 'button';
    botaoCancelar.id = 'botao-cancelar-inscricao';
    botaoCancelar.className = 'botao botao-cancelar cancelar-inscricao';
    botaoCancelar.dataset.id = minhaInscricao.id;
    botaoCancelar.textContent = 'Cancelar inscrição';
    area.appendChild(botaoCancelar);

    iniciarContagemRegressiva();
  }

  async function buscarMinhaInscricao(atividadeId) {
    const resposta = await fetch(
      `${ENDERECO_API}/inscricoes?atividadeId=${encodeURIComponent(atividadeId)}`,
      { headers: { 'X-Usuario': seletorUsuario.value } }
    );
    if (!resposta.ok) {
      const corpo = await lerCorpoErro(resposta);
      return { erro: { status: resposta.status, corpo } };
    }
    const lista = await resposta.json();
    const usuarioAtual = seletorUsuario.value;
    const minha = (Array.isArray(lista) ? lista : []).find(
      (i) =>
        i.atividadeId === atividadeId &&
        (i.participanteId === undefined || i.participanteId === usuarioAtual) &&
        STATUS_ATIVOS_INSCRICAO.includes(i.status)
    );
    return { inscricao: minha || null };
  }

  async function carregarEstadoInscricao(atividade) {
    mostrarCarregandoInscricaoDetalhe();
    try {
      const resultado = await buscarMinhaInscricao(atividade.id);
      if (resultado.erro) {
        mostrarErroInscricaoDetalhe(resultado.erro.status, resultado.erro.corpo);
        return;
      }
      renderizarAreaInscricaoDetalhe(atividade, resultado.inscricao);
    } catch (_) {
      mostrarErroInscricaoDetalhe(null, null);
    }
  }

  async function recarregarDetalhes(atividadeId) {
    atividadeAtualId = atividadeId;
    try {
      const resposta = await fetch(`${ENDERECO_API}/atividades/${atividadeId}`, {
        headers: { 'X-Usuario': seletorUsuario.value }
      });
      if (!resposta.ok) {
        const corpo = await lerCorpoErro(resposta);
        mostrarErroDetalhes(resposta.status, corpo);
        return;
      }
      const atividade = await resposta.json();
      renderizarDetalhes(atividade);
      await carregarEstadoInscricao(atividade);
    } catch (_) {
      mostrarErroDetalhes(null, null);
    }
  }

  async function inscreverNaAtividade(atividadeId, botao) {
    const rotuloOriginal = botao ? botao.textContent : 'Inscrever-se';
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando…';
    }
    const infoInicial = document.getElementById('status-inscricao');
    if (infoInicial) {
      infoInicial.textContent = 'Enviando inscrição…';
      infoInicial.className = 'status carregando';
    }
    try {
      const resposta = await fetch(`${ENDERECO_API}/atividades/${atividadeId}/inscricoes`, {
        method: 'POST',
        headers: { 'X-Usuario': seletorUsuario.value }
      });
      if (!resposta.ok) {
        const corpo = await lerCorpoErro(resposta);
        const area = obterAreaInscricao();
        let alvo = document.getElementById('status-inscricao');
        if (!alvo) {
          alvo = document.createElement('p');
          alvo.id = 'status-inscricao';
          alvo.setAttribute('role', 'status');
          area.appendChild(alvo);
        }
        alvo.textContent = mensagemDeErro(corpo, resposta.status);
        alvo.className = 'status erro';
        if (corpo && corpo.erro) {
          alvo.dataset.erro = corpo.erro;
        }
        if (botao && document.contains(botao)) {
          botao.disabled = false;
          botao.textContent = rotuloOriginal;
        }
        return;
      }
      await recarregarDetalhes(atividadeId);
    } catch (_) {
      mostrarErroInscricaoDetalhe(null, null);
    }
  }

  async function cancelarInscricao(inscricaoId, elementos) {
    const { botao, erroAlvo, atividadeId } = elementos || {};
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Cancelando…';
    }
    try {
      const resposta = await fetch(`${ENDERECO_API}/inscricoes/${inscricaoId}/cancelamento`, {
        method: 'POST',
        headers: { 'X-Usuario': seletorUsuario.value }
      });
      if (!resposta.ok) {
        const corpo = await lerCorpoErro(resposta);
        const mensagem = mensagemDeErro(corpo, resposta.status);
        if (erroAlvo) {
          erroAlvo.textContent = mensagem;
          erroAlvo.className = 'status erro';
          if (corpo && corpo.erro) {
            erroAlvo.dataset.erro = corpo.erro;
          }
        } else {
          mostrarErroInscricaoDetalhe(resposta.status, corpo);
        }
        if (botao) {
          botao.disabled = false;
          delete botao.dataset.armado;
          botao.textContent = 'Cancelar inscrição';
        }
        return;
      }
      const idDetalhe = atividadeId || atividadeAtualId;
      const detalheVisivel = secaoDetalhes && !secaoDetalhes.hidden && idDetalhe;
      if (detalheVisivel) {
        await recarregarDetalhes(idDetalhe);
      } else {
        await carregarMinhasInscricoes();
      }
    } catch (_) {
      if (erroAlvo) {
        erroAlvo.textContent = 'Não foi possível acessar a API.';
        erroAlvo.className = 'status erro';
      } else {
        mostrarErroInscricaoDetalhe(null, null);
      }
      if (botao) {
        botao.disabled = false;
        delete botao.dataset.armado;
        botao.textContent = 'Cancelar inscrição';
      }
    }
  }

  async function confirmarVaga(inscricaoId, elementos) {
    const { botao, erroAlvo } = elementos || {};
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Confirmando…';
    }
    try {
      const resposta = await fetch(`${ENDERECO_API}/inscricoes/${inscricaoId}/confirmacao`, {
        method: 'POST',
        headers: { 'X-Usuario': seletorUsuario.value }
      });
      if (!resposta.ok) {
        const corpo = await lerCorpoErro(resposta);
        const mensagem = mensagemDeErro(corpo, resposta.status);
        if (erroAlvo) {
          erroAlvo.textContent = mensagem;
          erroAlvo.className = 'status erro';
          if (corpo && corpo.erro) {
            erroAlvo.dataset.erro = corpo.erro;
          }
        } else {
          const area = obterAreaInscricao();
          let alvo = document.getElementById('status-inscricao');
          if (!alvo) {
            alvo = document.createElement('p');
            alvo.id = 'status-inscricao';
            area.appendChild(alvo);
          }
          alvo.textContent = mensagem;
          alvo.className = 'status erro';
          if (corpo && corpo.erro) {
            alvo.dataset.erro = corpo.erro;
          }
        }
        if (botao) {
          botao.disabled = false;
          botao.textContent = 'Confirmar vaga';
          const cartao = botao.closest ? botao.closest('li, div') : null;
          const ate = cartao ? cartao.querySelector('[data-convocada-ate]') : document.querySelector('[data-convocada-ate]');
          if (ate && ate.dataset.convocadaAte && new Date(ate.dataset.convocadaAte).getTime() <= Date.now()) {
            botao.disabled = true;
          }
        }
        return;
      }
      const detalheVisivel = secaoDetalhes && !secaoDetalhes.hidden && atividadeAtualId;
      if (detalheVisivel) {
        await recarregarDetalhes(atividadeAtualId);
      } else {
        await carregarMinhasInscricoes();
      }
    } catch (_) {
      if (erroAlvo) {
        erroAlvo.textContent = 'Não foi possível acessar a API.';
        erroAlvo.className = 'status erro';
      }
      if (botao) {
        botao.disabled = false;
        botao.textContent = 'Confirmar vaga';
      }
    }
  }

  function atualizarContagens() {
    const agoraMs = Date.now();
    const nos = document.querySelectorAll('[data-convocada-ate]');
    for (const no of nos) {
      const ate = no.dataset.convocadaAte;
      if (!ate) {
        continue;
      }
      const restante = new Date(ate).getTime() - agoraMs;
      if (restante <= 0) {
        no.textContent = 'Prazo expirado';
      } else {
        no.textContent = `Expira em ${formatarContagemRegressiva(restante)}`;
      }
      const escopo = no.closest ? no.closest('li, div') : null;
      const botao = escopo ? escopo.querySelector('.confirmar-vaga') : null;
      if (botao && !botao.dataset.ocupado) {
        botao.disabled = restante <= 0;
      }
    }
  }

  let intervaloContagem = null;
  function iniciarContagemRegressiva() {
    atualizarContagens();
    if (intervaloContagem !== null) {
      return;
    }
    intervaloContagem = setInterval(atualizarContagens, 1000);
    if (intervaloContagem && typeof intervaloContagem.unref === 'function') {
      intervaloContagem.unref();
    }
  }

  function montarCartaoInscricao(inscricao, atividade) {
    const cartao = document.createElement('li');
    cartao.className = 'cartao cartao-inscricao';
    cartao.dataset.id = inscricao.id;
    if (atividade) {
      cartao.dataset.atividadeId = atividade.id;
    } else {
      cartao.dataset.atividadeId = inscricao.atividadeId;
    }

    const titulo = document.createElement('h3');
    titulo.textContent = atividade ? atividade.titulo : inscricao.atividadeId;
    cartao.appendChild(titulo);

    if (atividade && Array.isArray(atividade.encontros)) {
      const lista = document.createElement('ul');
      for (const encontro of atividade.encontros) {
        const item = document.createElement('li');
        item.className = 'encontro';
        item.textContent = `${formatarDataEHora(encontro.inicio)} – ${formatarDataEHora(encontro.fim)}`;
        lista.appendChild(item);
      }
      cartao.appendChild(lista);
    }

    const estado = document.createElement('p');
    estado.className = `status-inscricao status-${inscricao.status.replace('_', '-')}`;
    estado.dataset.status = inscricao.status;
    if (inscricao.status === 'confirmada') {
      estado.textContent = ROTULO_STATUS_INSCRICAO.confirmada;
    } else if (inscricao.status === 'em_espera') {
      if (inscricao.posicaoNaEspera !== undefined && inscricao.posicaoNaEspera !== null) {
        estado.textContent = `Na espera — ${formatarPosicaoEspera(inscricao.posicaoNaEspera)}`;
      } else {
        estado.textContent = ROTULO_STATUS_INSCRICAO.em_espera;
      }
    } else if (inscricao.status === 'convocada') {
      estado.textContent = ROTULO_STATUS_INSCRICAO.convocada;
      if (inscricao.convocadaAte) {
        const contagem = document.createElement('span');
        contagem.className = 'contagem-regressiva';
        contagem.dataset.convocadaAte = inscricao.convocadaAte;
        const restante = new Date(inscricao.convocadaAte).getTime() - Date.now();
        contagem.textContent = restante <= 0 ? 'Prazo expirado' : `Expira em ${formatarContagemRegressiva(restante)}`;
        estado.appendChild(document.createTextNode(' — '));
        estado.appendChild(contagem);
      }
    } else if (inscricao.status === 'cancelada') {
      estado.textContent = ROTULO_STATUS_INSCRICAO.cancelada;
    } else if (inscricao.status === 'expirada') {
      estado.textContent = `${ROTULO_STATUS_INSCRICAO.expirada} (prazo expirado)`;
    } else {
      estado.textContent = inscricao.status;
    }
    cartao.appendChild(estado);

    const erroLinha = document.createElement('p');
    erroLinha.className = 'status';
    erroLinha.dataset.papel = 'erro-inscricao';
    erroLinha.setAttribute('role', 'status');
    cartao.appendChild(erroLinha);

    const acoes = document.createElement('div');
    acoes.className = 'acoes-inscricao';

    if (inscricao.status === 'convocada') {
      const botaoConfirmar = document.createElement('button');
      botaoConfirmar.type = 'button';
      botaoConfirmar.className = 'botao confirmar-vaga';
      botaoConfirmar.dataset.id = inscricao.id;
      botaoConfirmar.textContent = 'Confirmar vaga';
      if (inscricao.convocadaAte && new Date(inscricao.convocadaAte).getTime() <= Date.now()) {
        botaoConfirmar.disabled = true;
      }
      acoes.appendChild(botaoConfirmar);
    }

    if (STATUS_ATIVOS_INSCRICAO.includes(inscricao.status)) {
      const botaoCancelar = document.createElement('button');
      botaoCancelar.type = 'button';
      botaoCancelar.className = 'ver-detalhes cancelar-inscricao';
      botaoCancelar.dataset.id = inscricao.id;
      botaoCancelar.textContent = 'Cancelar inscrição';
      acoes.appendChild(botaoCancelar);
    }

    if (acoes.children.length > 0) {
      cartao.appendChild(acoes);
    }

    return cartao;
  }

  function mostrarCarregandoMinhas() {
    if (statusMinhas) {
      statusMinhas.textContent = 'Carregando inscrições…';
      statusMinhas.className = 'status carregando';
    }
    if (listaInscricoes) {
      listaInscricoes.innerHTML = '';
    }
    if (botaoTentarMinhas) {
      botaoTentarMinhas.hidden = true;
    }
  }

  function mostrarErroMinhas(statusHTTP, corpo) {
    if (statusMinhas) {
      statusMinhas.textContent = mensagemDeErro(corpo, statusHTTP);
      statusMinhas.className = 'status erro';
      if (corpo && corpo.erro) {
        statusMinhas.dataset.erro = corpo.erro;
      } else {
        delete statusMinhas.dataset.erro;
      }
    }
    if (listaInscricoes) {
      listaInscricoes.innerHTML = '';
    }
    if (botaoTentarMinhas) {
      botaoTentarMinhas.hidden = false;
    }
  }

  function mostrarVazioMinhas() {
    if (statusMinhas) {
      statusMinhas.textContent = 'Você ainda não tem inscrições.';
      statusMinhas.className = 'status';
      delete statusMinhas.dataset.erro;
    }
    if (listaInscricoes) {
      listaInscricoes.innerHTML = '';
      const item = document.createElement('li');
      item.className = 'cartao';
      const texto = document.createElement('p');
      texto.textContent = 'Explore a grade e inscreva-se em uma atividade.';
      item.appendChild(texto);
      const link = document.createElement('button');
      link.type = 'button';
      link.id = 'link-grade';
      link.className = 'botao';
      link.textContent = 'Ver grade de atividades';
      item.appendChild(link);
      listaInscricoes.appendChild(item);
    }
    if (botaoTentarMinhas) {
      botaoTentarMinhas.hidden = true;
    }
  }

  async function carregarMinhasInscricoes() {
    if (!secaoMinhas || !statusMinhas || !listaInscricoes) {
      return;
    }
    mostrarCarregandoMinhas();
    try {
      const resposta = await fetch(`${ENDERECO_API}/inscricoes`, {
        headers: { 'X-Usuario': seletorUsuario.value }
      });
      if (!resposta.ok) {
        const corpo = await lerCorpoErro(resposta);
        mostrarErroMinhas(resposta.status, corpo);
        return;
      }
      const inscricoes = await resposta.json();
      if (!Array.isArray(inscricoes) || inscricoes.length === 0) {
        mostrarVazioMinhas();
        return;
      }

      statusMinhas.textContent = '';
      statusMinhas.className = 'status';
      delete statusMinhas.dataset.erro;
      listaInscricoes.innerHTML = '';
      if (botaoTentarMinhas) {
        botaoTentarMinhas.hidden = true;
      }

      let mapaAtividades = {};
      try {
        const respAtividades = await fetch(`${ENDERECO_API}/atividades`, {
          headers: { 'X-Usuario': seletorUsuario.value }
        });
        if (respAtividades.ok) {
          const atividades = await respAtividades.json();
          for (const atv of atividades) {
            mapaAtividades[atv.id] = atv;
          }
        }
      } catch (_) {
        mapaAtividades = {};
      }

      const faltantes = inscricoes.filter((i) => !mapaAtividades[i.atividadeId]);
      for (const ins of faltantes) {
        try {
          const r = await fetch(`${ENDERECO_API}/atividades/${ins.atividadeId}`, {
            headers: { 'X-Usuario': seletorUsuario.value }
          });
          if (r.ok) {
            const atv = await r.json();
            mapaAtividades[atv.id] = atv;
          }
        } catch (_) {
          // mantém fallback por atividadeId
        }
      }

      const fragmento = document.createDocumentFragment();
      for (const inscricao of inscricoes) {
        fragmento.appendChild(montarCartaoInscricao(inscricao, mapaAtividades[inscricao.atividadeId] || null));
      }
      listaInscricoes.appendChild(fragmento);
      iniciarContagemRegressiva();
    } catch (_) {
      mostrarErroMinhas(null, null);
    }
  }

  function abrirMinhasInscricoes() {
    if (secaoGrade) {
      secaoGrade.hidden = true;
    }
    if (secaoDetalhes) {
      secaoDetalhes.hidden = true;
    }
    if (secaoCriacao) {
      secaoCriacao.hidden = true;
    }
    if (secaoMinhas) {
      secaoMinhas.hidden = false;
    }
    carregarMinhasInscricoes();
  }

  async function abrirDetalhes(id) {
    atividadeAtualId = id;
    secaoGrade.hidden = true;
    if (secaoMinhas) {
      secaoMinhas.hidden = true;
    }
    if (secaoCriacao) {
      secaoCriacao.hidden = true;
    }
    secaoDetalhes.hidden = false;
    mostrarCarregandoDetalhes();

    try {
      const resposta = await fetch(`${ENDERECO_API}/atividades/${id}`, {
        headers: { 'X-Usuario': seletorUsuario.value }
      });

      if (!resposta.ok) {
        let corpo = null;
        try {
          corpo = await resposta.json();
        } catch (_) {
          corpo = null;
        }
        mostrarErroDetalhes(resposta.status, corpo);
        return;
      }

      const atividade = await resposta.json();
      renderizarDetalhes(atividade);
      await carregarEstadoInscricao(atividade);
    } catch (erro) {
      mostrarErroDetalhes(null, null);
    }
  }

  function voltarParaGrade() {
    atividadeAtualId = null;
    secaoDetalhes.hidden = true;
    secaoCriacao.hidden = true;
    if (secaoMinhas) {
      secaoMinhas.hidden = true;
    }
    secaoGrade.hidden = false;
    carregarAtividades();
  }

  function mostrarMensagemCriacao(texto, classe) {
    statusCriacao.textContent = texto;
    statusCriacao.className = classe ? `status ${classe}` : 'status';
  }

  function adicionarLinhaEncontro() {
    const indice = listaEncontros.children.length;

    const linha = document.createElement('div');
    linha.className = 'linha-encontro';

    const campoInicio = document.createElement('div');
    campoInicio.className = 'campo';
    const rotuloInicio = document.createElement('label');
    rotuloInicio.textContent = 'Início';
    rotuloInicio.htmlFor = `encontro-${indice}-inicio`;
    const inputInicio = document.createElement('input');
    inputInicio.type = 'datetime-local';
    inputInicio.id = `encontro-${indice}-inicio`;
    campoInicio.appendChild(rotuloInicio);
    campoInicio.appendChild(inputInicio);

    const campoFim = document.createElement('div');
    campoFim.className = 'campo';
    const rotuloFim = document.createElement('label');
    rotuloFim.textContent = 'Fim';
    rotuloFim.htmlFor = `encontro-${indice}-fim`;
    const inputFim = document.createElement('input');
    inputFim.type = 'datetime-local';
    inputFim.id = `encontro-${indice}-fim`;
    campoFim.appendChild(rotuloFim);
    campoFim.appendChild(inputFim);

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'ver-detalhes remover-encontro';
    remover.textContent = 'Remover';

    linha.appendChild(campoInicio);
    linha.appendChild(campoFim);
    linha.appendChild(remover);
    listaEncontros.appendChild(linha);
  }

  async function carregarSalas() {
    try {
      const resposta = await fetch(`${ENDERECO_API}/salas`, {
        headers: { 'X-Usuario': seletorUsuario.value }
      });

      if (!resposta.ok) {
        let corpo = null;
        try {
          corpo = await resposta.json();
        } catch (_) {
          corpo = null;
        }
        mostrarMensagemCriacao(corpo && corpo.mensagem ? corpo.mensagem : 'Erro ao carregar salas.', 'erro');
        return;
      }

      const salas = await resposta.json();
      campoSala.innerHTML = '';
      for (const sala of salas) {
        const opcao = document.createElement('option');
        opcao.value = sala.id;
        opcao.textContent = `${sala.id} — ${sala.nome}`;
        campoSala.appendChild(opcao);
      }
    } catch (_) {
      mostrarMensagemCriacao('Não foi possível acessar a API.', 'erro');
    }
  }

  function abrirCriacao() {
    secaoGrade.hidden = true;
    secaoDetalhes.hidden = true;
    if (secaoMinhas) {
      secaoMinhas.hidden = true;
    }
    secaoCriacao.hidden = false;

    campoTitulo.value = '';
    campoTipo.value = 'palestra';
    campoVagas.value = '';
    confirmacaoCriacao.hidden = true;
    confirmacaoCriacao.textContent = '';
    formCriacao.hidden = false;
    botaoEnviarCriacao.hidden = false;
    botaoEnviarCriacao.disabled = false;
    listaEncontros.innerHTML = '';
    adicionarLinhaEncontro();
    mostrarMensagemCriacao('', '');

    carregarSalas();
  }

  function coletarEncontros() {
    const encontros = [];
    for (const linha of listaEncontros.children) {
      encontros.push({
        inicio: horarioLocalParaBrasilia(linha.querySelector('input').value),
        fim: horarioLocalParaBrasilia(linha.querySelectorAll('input')[1].value)
      });
    }
    return encontros;
  }

  async function enviarCriacao(evento) {
    evento.preventDefault();

    confirmacaoCriacao.hidden = true;
    confirmacaoCriacao.textContent = '';
    botaoEnviarCriacao.disabled = true;
    mostrarMensagemCriacao('Enviando…', 'carregando');

    const corpo = {
      titulo: campoTitulo.value,
      tipo: campoTipo.value,
      salaId: campoSala.value,
      vagas: vagasParaNumber(campoVagas.value),
      encontros: coletarEncontros()
    };

    try {
      const resposta = await fetch(`${ENDERECO_API}/atividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario': seletorUsuario.value
        },
        body: JSON.stringify(corpo)
      });

      if (!resposta.ok) {
        let corpoErro = null;
        try {
          corpoErro = await resposta.json();
        } catch (_) {
          corpoErro = null;
        }
        mostrarMensagemCriacao(
          corpoErro && corpoErro.mensagem ? corpoErro.mensagem : `Erro ${resposta.status} ao criar a atividade.`,
          'erro'
        );
        botaoEnviarCriacao.disabled = false;
        return;
      }

      const atividade = await resposta.json();
      botaoEnviarCriacao.disabled = false;
      formCriacao.hidden = true;
      botaoEnviarCriacao.hidden = true;
      confirmacaoCriacao.textContent =
        `Atividade criada: ${atividade.titulo} (${atividade.id}) — ` +
        `situação ${ROTULO_SITUACAO[atividade.situacao] || atividade.situacao}.`;
      confirmacaoCriacao.hidden = false;
      mostrarMensagemCriacao('', '');
    } catch (_) {
      mostrarMensagemCriacao('Não foi possível acessar a API.', 'erro');
      botaoEnviarCriacao.disabled = false;
    }
  }

  preencherUsuarios();
  seletorUsuario.value = 'p-carla';

  seletorUsuario.addEventListener('change', carregarAtividades);
  campoDia.addEventListener('change', carregarAtividades);
  seletorTipo.addEventListener('change', carregarAtividades);
  listaEl.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.ver-detalhes');
    if (botao) {
      abrirDetalhes(botao.dataset.id);
    }
  });
  botaoVoltar.addEventListener('click', voltarParaGrade);
  botaoNovaAtividade.addEventListener('click', abrirCriacao);
  botaoCancelarCriacao.addEventListener('click', voltarParaGrade);
  botaoAdicionarEncontro.addEventListener('click', adicionarLinhaEncontro);
  listaEncontros.addEventListener('click', (evento) => {
    const remover = evento.target.closest('.remover-encontro');
    if (remover) {
      remover.closest('.linha-encontro').remove();
    }
  });
  formCriacao.addEventListener('submit', enviarCriacao);

  if (botaoMinhasInscricoes) {
    botaoMinhasInscricoes.addEventListener('click', abrirMinhasInscricoes);
  }
  if (botaoVoltarMinhas) {
    botaoVoltarMinhas.addEventListener('click', voltarParaGrade);
  }
  if (botaoTentarMinhas) {
    botaoTentarMinhas.addEventListener('click', carregarMinhasInscricoes);
  }

  conteudoDetalhes.addEventListener('click', async (evento) => {
    const botaoInscrever = evento.target.closest('#botao-inscrever');
    if (botaoInscrever) {
      await inscreverNaAtividade(botaoInscrever.dataset.atividadeId, botaoInscrever);
      return;
    }
    const botaoConfirmar = evento.target.closest('#botao-confirmar-detalhe');
    if (botaoConfirmar) {
      botaoConfirmar.dataset.ocupado = '1';
      const erroAlvo = document.getElementById('status-inscricao');
      await confirmarVaga(botaoConfirmar.dataset.id, {
        botao: botaoConfirmar,
        erroAlvo
      });
      delete botaoConfirmar.dataset.ocupado;
      return;
    }
    const botaoCancelar = evento.target.closest('#botao-cancelar-inscricao');
    if (botaoCancelar) {
      if (botaoCancelar.dataset.armado !== '1') {
        botaoCancelar.dataset.armado = '1';
        botaoCancelar.textContent = 'Confirmar cancelamento';
        return;
      }
      delete botaoCancelar.dataset.armado;
      const area = obterAreaInscricao();
      const atividadeId = botaoInscreverAtividadeAtual();
      await cancelarInscricao(botaoCancelar.dataset.id, {
        botao: botaoCancelar,
        erroAlvo: document.getElementById('status-inscricao'),
        atividadeId
      });
      void area;
    }
  });

  function botaoInscreverAtividadeAtual() {
    const botao = document.getElementById('botao-inscrever');
    if (botao && botao.dataset.atividadeId) {
      return botao.dataset.atividadeId;
    }
    const cancelar = document.getElementById('botao-cancelar-inscricao');
    if (cancelar && cancelar.dataset.atividadeId) {
      return cancelar.dataset.atividadeId;
    }
    return atividadeAtualId;
  }

  if (listaInscricoes) {
    listaInscricoes.addEventListener('click', async (evento) => {
      const linkGrade = evento.target.closest('#link-grade');
      if (linkGrade) {
        voltarParaGrade();
        return;
      }
      const botaoConfirmar = evento.target.closest('.confirmar-vaga');
      if (botaoConfirmar) {
        botaoConfirmar.dataset.ocupado = '1';
        const cartao = botaoConfirmar.closest('li');
        const erroAlvo = cartao ? cartao.querySelector('[data-papel="erro-inscricao"]') : null;
        await confirmarVaga(botaoConfirmar.dataset.id, { botao: botaoConfirmar, erroAlvo });
        delete botaoConfirmar.dataset.ocupado;
        return;
      }
      const botaoCancelar = evento.target.closest('.cancelar-inscricao');
      if (botaoCancelar) {
        if (botaoCancelar.dataset.armado !== '1') {
          botaoCancelar.dataset.armado = '1';
          botaoCancelar.textContent = 'Confirmar cancelamento';
          return;
        }
        delete botaoCancelar.dataset.armado;
        const cartao = botaoCancelar.closest('li');
        const erroAlvo = cartao ? cartao.querySelector('[data-papel="erro-inscricao"]') : null;
        await cancelarInscricao(botaoCancelar.dataset.id, { botao: botaoCancelar, erroAlvo });
      }
    });
  }

  carregarAtividades();

  return {
    carregarAtividades,
    abrirDetalhes,
    abrirCriacao,
    voltarParaGrade,
    carregarSalas,
    enviarCriacao,
    abrirMinhasInscricoes,
    carregarMinhasInscricoes,
    inscreverNaAtividade,
    cancelarInscricao,
    confirmarVaga,
    atualizarContagens,
    iniciarContagemRegressiva
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    criarPainel,
    USUARIOS_CONTRATO,
    ROTULO_STATUS_INSCRICAO,
    STATUS_ATIVOS_INSCRICAO,
    formatarContagemRegressiva,
    formatarPosicaoEspera
  };
} else {
  // Navegador: inicia a interface contra a API local.
  criarPainel({
    document,
    enderecoApi: 'http://localhost:3000'
  });
}