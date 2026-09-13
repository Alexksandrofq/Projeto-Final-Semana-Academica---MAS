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
    res.status(200).json(serializarAtividade(atividade, agora()));
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