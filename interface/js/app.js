/* Semana Acadêmica — grade de atividades (M1) */

const ENDERECO_API = 'http://localhost:3000';

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
}

async function abrirDetalhes(id) {
  secaoGrade.hidden = true;
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
  } catch (erro) {
    mostrarErroDetalhes(null, null);
  }
}

function voltarParaGrade() {
  secaoDetalhes.hidden = true;
  secaoCriacao.hidden = true;
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

carregarAtividades();