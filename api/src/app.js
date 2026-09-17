const express = require('express');
const crypto = require('crypto');
const { criarBanco } = require('./banco');

function gerarId(prefixo) {
  return `${prefixo}${crypto.randomBytes(4).toString('hex')}`;
}

function validarCorpoAtividade(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return 'Corpo deve ser um objeto.';
  }
  if (typeof corpo.titulo !== 'string') {
    return 'Campo titulo (string) é obrigatório.';
  }
  if (typeof corpo.tipo !== 'string') {
    return 'Campo tipo (string) é obrigatório.';
  }
  if (corpo.tipo !== 'palestra' && corpo.tipo !== 'minicurso') {
    return 'Campo tipo deve ser palestra ou minicurso.';
  }
  if (typeof corpo.salaId !== 'string') {
    return 'Campo salaId (string) é obrigatório.';
  }
  if (typeof corpo.vagas !== 'number') {
    return 'Campo vagas (número) é obrigatório.';
  }
  if (!Array.isArray(corpo.encontros)) {
    return 'Campo encontros (array) é obrigatório.';
  }
  for (const encontro of corpo.encontros) {
    if (!encontro || typeof encontro !== 'object' || Array.isArray(encontro)) {
      return 'Cada encontro deve ser um objeto.';
    }
    if (typeof encontro.inicio !== 'string' || typeof encontro.fim !== 'string') {
      return 'Cada encontro deve ter inicio e fim como string.';
    }
    if (Number.isNaN(Date.parse(encontro.inicio)) || Number.isNaN(Date.parse(encontro.fim))) {
      return 'Cada encontro deve ter inicio e fim como instante válido.';
    }
  }
  return null;
}

function calcularSituacao(atividade, agora) {
  if (atividade.cancelada) {
    return 'cancelada';
  }

  const inicioMs = Math.min(...atividade.encontros.map((e) => new Date(e.inicio).getTime()));
  const fimMs = Math.max(...atividade.encontros.map((e) => new Date(e.fim).getTime()));
  const agoraMs = agora.getTime();

  if (agoraMs >= fimMs) {
    return 'encerrada';
  }
  if (agoraMs >= inicioMs) {
    return 'em_andamento';
  }
  return 'prevista';
}

function encontrosSobrepostos(a, b) {
  const aI = new Date(a.inicio).getTime();
  const aF = new Date(a.fim).getTime();
  const bI = new Date(b.inicio).getTime();
  const bF = new Date(b.fim).getTime();
  return aI < bF && bI < aF;
}

function temConflitoDeHorario(banco, participanteId, novaAtividade) {
  const inscricoes = banco.listarInscricoesPorParticipante(participanteId)
    .filter((i) => i.status === 'confirmada' || i.status === 'convocada');
  for (const ins of inscricoes) {
    const outra = banco.obterAtividade(ins.atividadeId);
    if (!outra || outra.cancelada) continue;
    for (const eNovo of novaAtividade.encontros) {
      for (const eOutro of outra.encontros) {
        if (encontrosSobrepostos(eNovo, eOutro)) return true;
      }
    }
  }
  return false;
}

function contarMinicursosOcupados(banco, participanteId, ignorarInscricaoId = null) {
  const inscricoes = banco.listarInscricoesPorParticipante(participanteId)
    .filter((i) => (i.status === 'confirmada' || i.status === 'convocada') && i.id !== ignorarInscricaoId);
  let n = 0;
  for (const ins of inscricoes) {
    const atv = banco.obterAtividade(ins.atividadeId);
    if (atv && !atv.cancelada && atv.tipo === 'minicurso') n++;
  }
  return n;
}

function temConflitoDeHorarioIgnorando(banco, participanteId, novaAtividade, ignorarInscricaoId = null) {
  const inscricoes = banco.listarInscricoesPorParticipante(participanteId)
    .filter((i) => (i.status === 'confirmada' || i.status === 'convocada') && i.id !== ignorarInscricaoId);
  for (const ins of inscricoes) {
    const outra = banco.obterAtividade(ins.atividadeId);
    if (!outra || outra.cancelada) continue;
    for (const eNovo of novaAtividade.encontros) {
      for (const eOutro of outra.encontros) {
        if (encontrosSobrepostos(eNovo, eOutro)) return true;
      }
    }
  }
  return false;
}

function convocarProximaErecomputar(banco, atividadeId, agoraInstante, liberouVaga = true) {
  const inscricoes = banco.listarInscricoesPorAtividade(atividadeId);
  const emEspera = inscricoes
    .filter((i) => i.status === 'em_espera')
    .sort((a, b) => new Date(a.criadaEm) - new Date(b.criadaEm));
  let convocadoId = null;
  // Só convoca quando uma vaga foi liberada (cancelamento de confirmada/convocada
  // ou expiração). Cancelar em_espera apenas recomputa posições (RN-204/RN-212).
  if (liberouVaga && emEspera.length > 0) {
    const primeira = emEspera[0];
    primeira.status = 'convocada';
    primeira.convocadaAte = new Date(agoraInstante.getTime() + 2 * 60 * 60 * 1000).toISOString();
    primeira.posicaoNaEspera = null;
    banco.atualizarInscricao(primeira);
    convocadoId = primeira.id;
  }
  const restantes = banco.listarInscricoesPorAtividade(atividadeId)
    .filter((i) => i.status === 'em_espera')
    .sort((a, b) => new Date(a.criadaEm) - new Date(b.criadaEm));
  restantes.forEach((ins, index) => {
    ins.posicaoNaEspera = index + 1;
    banco.atualizarInscricao(ins);
  });
  return convocadoId;
}

function serializarAtividade(atividade, agora) {
  return {
    id: atividade.id,
    titulo: atividade.titulo,
    tipo: atividade.tipo,
    salaId: atividade.salaId,
    vagas: atividade.vagas,
    encontros: atividade.encontros,
    cargaHorariaMinutos: atividade.cargaHorariaMinutos,
    situacao: calcularSituacao(atividade, agora),
    ocupadas: 0,
    vagasRestantes: 0,
    emEspera: 0
  };
}

const ORIGEM_INTERFACE = 'http://localhost:5500';

function criarServidor(opcoes = {}) {
  const app = express();

  app.use((req, res, next) => {
    if (req.headers.origin === ORIGEM_INTERFACE) {
      res.setHeader('Access-Control-Allow-Origin', ORIGEM_INTERFACE);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Usuario');
    }
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json());

  let banco = criarBanco(opcoes);
  app.locals.banco = banco;
  let relogio = new Date('2026-10-13T09:00:00-03:00');

  const agora = () => (process.env.MODO_TESTE === '1' ? relogio : new Date());

  app.post('/_teste/reset', (req, res) => {
    if (process.env.MODO_TESTE !== '1') {
      return res.status(404).end();
    }
    banco.recarregarDadosIniciais();
    relogio = new Date('2026-10-13T09:00:00-03:00');
    res.status(204).end();
  });

  app.put('/_teste/relogio', (req, res) => {
    if (process.env.MODO_TESTE !== '1') {
      return res.status(404).end();
    }
    relogio = new Date(req.body.agora);
    res.status(200).json({ agora: relogio.toISOString() });
  });

  app.get('/_teste/relogio', (req, res) => {
    if (process.env.MODO_TESTE !== '1') {
      return res.status(404).end();
    }
    res.status(200).json({ agora: relogio.toISOString() });
  });

  app.get('/salas', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    res.status(200).json(banco.listarSalas());
  });

  app.post('/atividades', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    if (usuario.papel !== 'organizacao') {
      return res.status(403).json({
        erro: 'SOMENTE_ORGANIZACAO',
        mensagem: 'Apenas organização pode criar atividades.'
      });
    }

    const mensagemCorpo = validarCorpoAtividade(req.body);
    if (mensagemCorpo) {
      return res.status(422).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: mensagemCorpo
      });
    }

    const { tipo, titulo, encontros, salaId, vagas } = req.body;

    if (vagas < 1) {
      return res.status(422).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'vagas deve ser no mínimo 1 (código específico pendente).'
      });
    }

    const capacidade = banco.obterSala(salaId)?.capacidade;
    if (capacidade !== undefined && vagas > capacidade) {
      return res.status(422).json({
        erro: 'VAGAS_ACIMA_DA_CAPACIDADE',
        mensagem: 'vagas não pode ultrapassar a capacidade da sala.'
      });
    }

    const DURACAO_MIN_MS = 60 * 60 * 1000;
    const DURACAO_MAX_MS = 4 * 60 * 60 * 1000;
    for (const encontro of encontros) {
      const inicio = new Date(encontro.inicio);
      const fim = new Date(encontro.fim);
      const duracao = fim - inicio;
      if (duracao < DURACAO_MIN_MS || duracao > DURACAO_MAX_MS) {
        return res.status(422).json({
          erro: 'ENCONTRO_INVALIDO',
          mensagem: 'Cada encontro deve durar entre 1 e 4 horas.'
        });
      }

      const diaInicio = new Date(inicio.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const diaFim = new Date(fim.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (diaInicio !== diaFim || diaInicio < '2026-10-19' || diaInicio > '2026-10-23') {
        return res.status(422).json({
          erro: 'ENCONTRO_INVALIDO',
          mensagem: 'Encontro deve começar e terminar no mesmo dia, entre 19 e 23/10/2026 (Brasília).'
        });
      }
    }

    for (let i = 0; i < encontros.length; i++) {
      for (let j = i + 1; j < encontros.length; j++) {
        const a = encontros[i];
        const b = encontros[j];
        const aInicio = new Date(a.inicio).getTime();
        const aFim = new Date(a.fim).getTime();
        const bInicio = new Date(b.inicio).getTime();
        const bFim = new Date(b.fim).getTime();
        if (aInicio < bFim && bInicio < aFim) {
          return res.status(422).json({
            erro: 'ENCONTRO_INVALIDO',
            mensagem: 'Encontros da mesma atividade não podem se sobrepor.'
          });
        }
      }
    }

    if (tipo === 'palestra' && (!encontros || encontros.length !== 1)) {
      return res.status(422).json({
        erro: 'QUANTIDADE_DE_ENCONTROS',
        mensagem: 'Palestra deve ter exatamente 1 encontro.'
      });
    }

    if (tipo === 'minicurso' && (encontros.length < 2 || encontros.length > 5)) {
      return res.status(422).json({
        erro: 'QUANTIDADE_DE_ENCONTROS',
        mensagem: 'Minicurso deve ter de 2 a 5 encontros.'
      });
    }

    const SEPARACAO_MIN_MS = 15 * 60 * 1000;
    for (const outra of banco.listarAtividades()) {
      if (outra.cancelada || outra.salaId !== salaId) {
        continue;
      }
      for (const encOutra of outra.encontros) {
        const oInicio = new Date(encOutra.inicio).getTime();
        const oFim = new Date(encOutra.fim).getTime();
        for (const encNovo of encontros) {
          const nInicio = new Date(encNovo.inicio).getTime();
          const nFim = new Date(encNovo.fim).getTime();
          if (!(nFim <= oInicio - SEPARACAO_MIN_MS || oFim <= nInicio - SEPARACAO_MIN_MS)) {
            return res.status(409).json({
              erro: 'CONFLITO_DE_SALA',
              mensagem: 'Encontros na mesma sala precisam de pelo menos 15 minutos de intervalo.'
            });
          }
        }
      }
    }

    const encontrosProntos = encontros
      .map((enc) => ({ id: gerarId('enc_'), inicio: enc.inicio, fim: enc.fim }))
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

    const cargaHorariaMinutos = encontros.reduce(
      (soma, enc) => soma + Math.round((new Date(enc.fim) - new Date(enc.inicio)) / 60000),
      0
    );

    const atividade = {
      id: gerarId('atv_'),
      titulo,
      tipo,
      salaId,
      vagas,
      encontros: encontrosProntos,
      cargaHorariaMinutos
    };

    banco.inserirAtividade(atividade);

    res.status(201).json(serializarAtividade(atividade, agora()));
  });

  app.get('/atividades', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    const { dia, tipo } = req.query;

    const lista = banco
      .listarAtividades()
      .filter((atividade) => {
        if (tipo !== undefined && atividade.tipo !== tipo) {
          return false;
        }
        if (dia !== undefined) {
          const temEncontroNoDia = atividade.encontros.some((enc) => {
            const diaEncontro = new Date(
              new Date(enc.inicio).getTime() - 3 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10);
            return diaEncontro === dia;
          });
          if (!temEncontroNoDia) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const inicioA = new Date(a.encontros[0].inicio).getTime();
        const inicioB = new Date(b.encontros[0].inicio).getTime();
        if (inicioA !== inicioB) {
          return inicioA - inicioB;
        }
        return a.titulo.localeCompare(b.titulo);
      })
      .map((atividade) => serializarAtividade(atividade, agora()));

    res.status(200).json(lista);
  });

  app.get('/atividades/:id', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    const atividade = banco.obterAtividade(req.params.id);
    if (!atividade) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Atividade não encontrada.'
      });
    }
    res.status(200).json(serializarAtividade(atividade, agora()));
  });

  app.patch('/atividades/:id', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    if (usuario.papel !== 'organizacao') {
      return res.status(403).json({
        erro: 'SOMENTE_ORGANIZACAO',
        mensagem: 'Apenas organização pode alterar atividades.'
      });
    }

    const atividade = banco.obterAtividade(req.params.id);
    if (!atividade) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Atividade não encontrada.'
      });
    }

    const { titulo, vagas, tipo, salaId, encontros } = req.body;

    if (titulo !== undefined && typeof titulo !== 'string') {
      return res.status(422).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'titulo deve ser string.'
      });
    }
    if (vagas !== undefined && typeof vagas !== 'number') {
      return res.status(422).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'vagas deve ser número.'
      });
    }

    if (atividade.cancelada) {
      return res.status(422).json({
        erro: 'ATIVIDADE_CANCELADA',
        mensagem: 'Atividade cancelada não pode ser alterada.'
      });
    }

    if (tipo !== undefined || salaId !== undefined || encontros !== undefined) {
      return res.status(422).json({
        erro: 'CAMPO_NAO_EDITAVEL',
        mensagem: 'Apenas titulo e vagas podem ser alterados.'
      });
    }

    if (titulo !== undefined) {
      atividade.titulo = titulo;
      banco.atualizarTitulo(atividade.id, titulo);
    }
    if (vagas !== undefined) {
      if (vagas < 1) {
        return res.status(422).json({
          erro: 'DADOS_INVALIDOS',
          mensagem: 'vagas deve ser no mínimo 1 (código específico pendente).'
        });
      }
      const capacidade = banco.obterSala(atividade.salaId)?.capacidade;
      if (capacidade !== undefined && vagas > capacidade) {
        return res.status(422).json({
          erro: 'VAGAS_ACIMA_DA_CAPACIDADE',
          mensagem: 'vagas não pode ultrapassar a capacidade da sala.'
        });
      }
      atividade.vagas = vagas;
      banco.atualizarVagas(atividade.id, vagas);
    }

    res.status(200).json(serializarAtividade(atividade, agora()));
  });

  app.post('/atividades/:id/cancelamento', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    if (usuario.papel !== 'organizacao') {
      return res.status(403).json({
        erro: 'SOMENTE_ORGANIZACAO',
        mensagem: 'Apenas organização pode cancelar atividades.'
      });
    }

    const atividade = banco.obterAtividade(req.params.id);
    if (!atividade) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Atividade não encontrada.'
      });
    }

    if (atividade.cancelada) {
      return res.status(422).json({
        erro: 'ATIVIDADE_CANCELADA',
        mensagem: 'Atividade já está cancelada.'
      });
    }

    const inicioPrimeiroEncontro = Math.min(
      ...atividade.encontros.map((e) => new Date(e.inicio).getTime())
    );
    if (agora().getTime() >= inicioPrimeiroEncontro) {
      return res.status(422).json({
        erro: 'ATIVIDADE_JA_INICIADA',
        mensagem: 'Atividade não pode ser cancelada depois de iniciada.'
      });
    }

    atividade.cancelada = true;
    banco.atualizarCancelada(atividade.id);
    for (const ins of banco.listarInscricoesPorAtividade(atividade.id)) {
      if (['confirmada', 'em_espera', 'convocada'].includes(ins.status)) {
        ins.status = 'cancelada';
        ins.posicaoNaEspera = null;
        ins.convocadaAte = null;
        banco.atualizarInscricao(ins);
      }
    }
    res.status(200).json(serializarAtividade(atividade, agora()));
  });

    app.post('/atividades/:id/inscricoes', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    if (usuario.papel !== 'participante') {
      return res.status(403).json({
        erro: 'SOMENTE_PARTICIPANTE',
        mensagem: 'Apenas participante pode se inscrever.'
      });
    }

    const atividade = banco.obterAtividade(req.params.id);
    if (!atividade) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Atividade não encontrada.'
      });
    }

    if (atividade.cancelada) {
      return res.status(422).json({
        erro: 'ATIVIDADE_CANCELADA',
        mensagem: 'Atividade cancelada.'
      });
    }

    const inicioPrimeiroEncontro = Math.min(
      ...atividade.encontros.map((e) => new Date(e.inicio).getTime())
    );
    if (agora().getTime() >= inicioPrimeiroEncontro - 30 * 60 * 1000) {
      return res.status(422).json({
        erro: 'INSCRICOES_ENCERRADAS',
        mensagem: 'Inscrições encerradas.'
      });
    }

    if (banco.jaInscrito(atividade.id, usuario.id)) {
      return res.status(409).json({
        erro: 'JA_INSCRITO',
        mensagem: 'Participante já inscrito nesta atividade.'
      });
    }

    if (temConflitoDeHorario(banco, usuario.id, atividade)) {
      return res.status(409).json({
        erro: 'CONFLITO_DE_HORARIO',
        mensagem: 'Conflito de horário com outra inscrição.'
      });
    }

    if (atividade.tipo === 'minicurso' && contarMinicursosOcupados(banco, usuario.id) >= 3) {
      return res.status(422).json({
        erro: 'LIMITE_DE_MINICURSOS',
        mensagem: 'Limite de 3 minicursos por participante.'
      });
    }

    const ativas = banco.contarInscricoesAtivasPorAtividade(atividade.id);
    const status = ativas < atividade.vagas ? 'confirmada' : 'em_espera';
    const posicaoNaEspera = status === 'em_espera' ? ativas - atividade.vagas + 1 : null;
    const inscricao = {
      id: gerarId('ins_'),
      atividadeId: atividade.id,
      participanteId: usuario.id,
      status,
      posicaoNaEspera,
      convocadaAte: null,
      criadaEm: agora().toISOString()
    };

    banco.inserirInscricao(inscricao);
    res.status(201).json(inscricao);
  });

  app.get('/inscricoes', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário não identificado.' });
    }
    let lista = banco.listarTodasInscricoes();
    if (usuario.papel === 'participante') {
      lista = lista.filter((i) => i.participanteId === usuario.id);
    }
    // Filtro ?atividadeId= existe no contrato (§5 M2). Sem ordenação garantida:
    // P15/P16 são pendentes sem regra definitiva (spec M2), então nenhuma
    // ordem é imposta aqui.
    if (req.query.atividadeId !== undefined) {
      lista = lista.filter((i) => i.atividadeId === req.query.atividadeId);
    }
    res.status(200).json(lista);
  });

  app.get('/inscricoes/:id', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }

    // Need to implement banc.obterInscricao(id)
    const inscricao = banco.obterInscricao(req.params.id);
    if (!inscricao) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Inscrição não encontrada.'
      });
    }
    
    if (usuario.papel === 'participante' && inscricao.participanteId !== usuario.id) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Inscrição não encontrada.'
      });
    }

    res.status(200).json(inscricao);
  });

  app.post('/inscricoes/:id/cancelamento', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({
        erro: 'USUARIO_DESCONHECIDO',
        mensagem: 'Usuário não identificado.'
      });
    }
    if (usuario.papel !== 'participante') {
      return res.status(403).json({
        erro: 'SOMENTE_PARTICIPANTE',
        mensagem: 'Apenas participante pode cancelar inscrição.'
      });
    }

    const inscricao = banco.obterInscricao(req.params.id);
    if (!inscricao || (usuario.papel === 'participante' && inscricao.participanteId !== usuario.id)) {
      return res.status(404).json({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Inscrição não encontrada.'
      });
    }

    if (['cancelada', 'expirada'].includes(inscricao.status)) {
      return res.status(422).json({
        erro: 'INSCRICAO_INATIVA',
        mensagem: 'Inscrição já está inativa.'
      });
    }

    const atividade = banco.obterAtividade(inscricao.atividadeId);
    const inicioPrimeiroEncontro = Math.min(...atividade.encontros.map((e) => new Date(e.inicio).getTime()));
    if (agora().getTime() >= inicioPrimeiroEncontro) {
      return res.status(422).json({
        erro: 'ATIVIDADE_JA_INICIADA',
        mensagem: 'Atividade já iniciada.'
      });
    }

    const liberouVaga = inscricao.status === 'confirmada' || inscricao.status === 'convocada';
    inscricao.status = 'cancelada';
    inscricao.posicaoNaEspera = null;
    inscricao.convocadaAte = null;
    banco.atualizarInscricao(inscricao);

    convocarProximaErecomputar(banco, atividade.id, agora(), liberouVaga);

    res.status(200).json(inscricao);
  });

  app.post('/inscricoes/:id/confirmacao', (req, res) => {
    const usuario = banco.obterUsuario(req.get('X-Usuario'));
    if (!usuario) {
      return res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário não identificado.' });
    }
    if (usuario.papel !== 'participante') {
      return res.status(403).json({ erro: 'SOMENTE_PARTICIPANTE', mensagem: 'Apenas participante pode confirmar inscrição.' });
    }
    const inscricao = banco.obterInscricao(req.params.id);
    if (!inscricao || (usuario.papel === 'participante' && inscricao.participanteId !== usuario.id)) {
      return res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada.' });
    }
    if (inscricao.status !== 'convocada') {
      return res.status(422).json({ erro: 'SEM_CONVOCACAO', mensagem: 'Inscrição não está convocada.' });
    }
    if (inscricao.convocadaAte && agora().getTime() > new Date(inscricao.convocadaAte).getTime()) {
      inscricao.status = 'expirada';
      inscricao.posicaoNaEspera = null;
      banco.atualizarInscricao(inscricao);
      convocarProximaErecomputar(banco, inscricao.atividadeId, agora());
      return res.status(422).json({ erro: 'CONVOCACAO_EXPIRADA', mensagem: 'Prazo de convocação expirado.' });
    }
    const atividade = banco.obterAtividade(inscricao.atividadeId);
    if (temConflitoDeHorarioIgnorando(banco, usuario.id, atividade, inscricao.id)) {
      return res.status(409).json({ erro: 'CONFLITO_DE_HORARIO', mensagem: 'Conflito de horário.' });
    }
    if (atividade.tipo === 'minicurso' && contarMinicursosOcupados(banco, usuario.id, inscricao.id) >= 3) {
      return res.status(422).json({ erro: 'LIMITE_DE_MINICURSOS', mensagem: 'Limite de 3 minicursos.' });
    }
    inscricao.status = 'confirmada';
    inscricao.convocadaAte = null;
    inscricao.posicaoNaEspera = null;
    banco.atualizarInscricao(inscricao);
    res.status(200).json(inscricao);
  });

  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      if (!req.path.startsWith('/_teste/') && !banco.obterUsuario(req.get('X-Usuario'))) {
        return res.status(401).json({
          erro: 'USUARIO_DESCONHECIDO',
          mensagem: 'Usuário não identificado.'
        });
      }
      return res.status(422).json({
        erro: 'DADOS_INVALIDOS',
        mensagem: 'Corpo deve ser JSON válido.'
      });
    }
    next(err);
  });

  return app;
}

module.exports = { criarServidor };