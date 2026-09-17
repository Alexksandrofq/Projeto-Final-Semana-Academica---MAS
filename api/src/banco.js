const Database = require('better-sqlite3');
const path = require('path');

const SALAS_INICIAIS = [
  { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
  { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
  { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
  { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
];

const USUARIOS_INICIAIS = [
  { id: 'org-ana', papel: 'organizacao' },
  { id: 'org-bruno', papel: 'organizacao' },
  { id: 'p-carla', papel: 'participante' },
  { id: 'p-diego', papel: 'participante' },
  { id: 'p-elisa', papel: 'participante' },
  { id: 'p-fabio', papel: 'participante' },
  { id: 'p-gabriela', papel: 'participante' },
  { id: 'p-heitor', papel: 'participante' },
  { id: 'p-isadora', papel: 'participante' },
  { id: 'p-joao', papel: 'participante' }
];

function montarAtividade(linha) {
  if (!linha) {
    return null;
  }
  return {
    id: linha.id,
    titulo: linha.titulo,
    tipo: linha.tipo,
    salaId: linha.salaId,
    vagas: linha.vagas,
    cargaHorariaMinutos: linha.cargaHorariaMinutos,
    cancelada: linha.cancelada === 1,
    encontros: JSON.parse(linha.encontros)
  };
}

function criarBanco(opcoes = {}) {
  const ehTeste = process.env.MODO_TESTE === '1';
  let arquivo;
  if (opcoes.arquivoBanco) {
    arquivo = opcoes.arquivoBanco;
  } else if (process.env.DB_ARQUIVO) {
    arquivo = process.env.DB_ARQUIVO;
  } else if (ehTeste) {
    arquivo = ':memory:';
  } else {
    arquivo = path.join(__dirname, '..', 'semana.db');
  }

  const db = new Database(arquivo);

  db.exec(`
    CREATE TABLE IF NOT EXISTS salas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      capacidade INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      papel TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atividades (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      salaId TEXT NOT NULL,
      vagas INTEGER NOT NULL,
      cargaHorariaMinutos INTEGER NOT NULL,
      cancelada INTEGER NOT NULL DEFAULT 0,
      encontros TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inscricoes (
      id TEXT PRIMARY KEY,
      atividadeId TEXT NOT NULL,
      participanteId TEXT NOT NULL,
      status TEXT NOT NULL,
      posicaoNaEspera INTEGER,
      convocadaAte TEXT,
      criadaEm TEXT NOT NULL,
      FOREIGN KEY (atividadeId) REFERENCES atividades(id)
    );
  `);

  const inserirSala = db.prepare('INSERT OR IGNORE INTO salas (id, nome, capacidade) VALUES (?, ?, ?)');
  const inserirUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (id, papel) VALUES (?, ?)');

  const plantarDadosIniciais = db.transaction(() => {
    for (const sala of SALAS_INICIAIS) {
      inserirSala.run(sala.id, sala.nome, sala.capacidade);
    }
    for (const usuario of USUARIOS_INICIAIS) {
      inserirUsuario.run(usuario.id, usuario.papel);
    }
  });
  plantarDadosIniciais();

  const stmtObterSala = db.prepare('SELECT id, nome, capacidade FROM salas WHERE id = ?');
  const stmtListarSalas = db.prepare('SELECT id, nome, capacidade FROM salas');
  const stmtObterUsuario = db.prepare('SELECT id, papel FROM usuarios WHERE id = ?');
  const stmtObterAtividade = db.prepare('SELECT * FROM atividades WHERE id = ?');
  const stmtListarAtividades = db.prepare('SELECT * FROM atividades');
  const stmtInserirAtividade = db.prepare(`
    INSERT INTO atividades (id, titulo, tipo, salaId, vagas, cargaHorariaMinutos, cancelada, encontros)
    VALUES (@id, @titulo, @tipo, @salaId, @vagas, @cargaHorariaMinutos, @cancelada, @encontros)
  `);
  const stmtAtualizarTitulo = db.prepare('UPDATE atividades SET titulo = ? WHERE id = ?');
  const stmtAtualizarVagas = db.prepare('UPDATE atividades SET vagas = ? WHERE id = ?');
  const stmtAtualizarCancelada = db.prepare('UPDATE atividades SET cancelada = 1 WHERE id = ?');
  const stmtApagarAtividades = db.prepare('DELETE FROM atividades');
  const stmtInserirInscricao = db.prepare(`
    INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
    VALUES (@id, @atividadeId, @participanteId, @status, @posicaoNaEspera, @convocadaAte, @criadaEm)
  `);
  const stmtListarInscricoesPorAtividade = db.prepare('SELECT * FROM inscricoes WHERE atividadeId = ?');
  const stmtContarInscricoesAtivasPorAtividade = db.prepare("SELECT COUNT(*) as count FROM inscricoes WHERE atividadeId = ? AND status IN ('confirmada', 'convocada', 'em_espera')");
  const stmtVerificarJaInscrito = db.prepare("SELECT 1 as um FROM inscricoes WHERE atividadeId = ? AND participanteId = ? AND status IN ('confirmada', 'convocada', 'em_espera')");
  const stmtListarInscricoesPorParticipante = db.prepare('SELECT * FROM inscricoes WHERE participanteId = ?');
  const stmtListarTodasInscricoes = db.prepare('SELECT * FROM inscricoes');
  const stmtObterInscricao = db.prepare('SELECT * FROM inscricoes WHERE id = ?');
  const stmtAtualizarInscricao = db.prepare('UPDATE inscricoes SET status = @status, posicaoNaEspera = @posicaoNaEspera, convocadaAte = @convocadaAte WHERE id = @id');
  const stmtApagarInscricoes = db.prepare('DELETE FROM inscricoes');

  return {
    obterSala(id) {
      const linha = stmtObterSala.get(id);
      return linha || null;
    },
    listarSalas() {
      return stmtListarSalas.all();
    },
    obterUsuario(id) {
      const linha = stmtObterUsuario.get(id);
      return linha || null;
    },
    obterAtividade(id) {
      return montarAtividade(stmtObterAtividade.get(id));
    },
    listarAtividades() {
      return stmtListarAtividades.all().map(montarAtividade);
    },
    inserirAtividade(atividade) {
      stmtInserirAtividade.run({
        id: atividade.id,
        titulo: atividade.titulo,
        tipo: atividade.tipo,
        salaId: atividade.salaId,
        vagas: atividade.vagas,
        cargaHorariaMinutos: atividade.cargaHorariaMinutos,
        cancelada: atividade.cancelada ? 1 : 0,
        encontros: JSON.stringify(atividade.encontros)
      });
    },
    atualizarTitulo(id, titulo) {
      stmtAtualizarTitulo.run(titulo, id);
    },
    atualizarVagas(id, vagas) {
      stmtAtualizarVagas.run(vagas, id);
    },
    atualizarCancelada(id) {
      stmtAtualizarCancelada.run(id);
    },
    inserirInscricao(inscricao) {
      stmtInserirInscricao.run(inscricao);
    },
    listarInscricoesPorAtividade(atividadeId) {
      return stmtListarInscricoesPorAtividade.all(atividadeId);
    },
    obterInscricao(id) {
      return stmtObterInscricao.get(id) || null;
    },
    atualizarInscricao(inscricao) {
      stmtAtualizarInscricao.run({
        id: inscricao.id,
        status: inscricao.status,
        posicaoNaEspera: inscricao.posicaoNaEspera ?? null,
        convocadaAte: inscricao.convocadaAte || null
      });
    },
    contarInscricoesAtivasPorAtividade(atividadeId) {
      return stmtContarInscricoesAtivasPorAtividade.get(atividadeId).count;
    },
    jaInscrito(atividadeId, participanteId) {
      return !!stmtVerificarJaInscrito.get(atividadeId, participanteId);
    },
    listarInscricoesPorParticipante(participanteId) {
      return stmtListarInscricoesPorParticipante.all(participanteId);
    },
    listarTodasInscricoes() {
      return stmtListarTodasInscricoes.all();
    },
    recarregarDadosIniciais() {
      const resetar = db.transaction(() => {
        stmtApagarInscricoes.run();
        stmtApagarAtividades.run();
        plantarDadosIniciais();
      });
      resetar();
    },
    fechar() {
      db.close();
    }
  };
}

module.exports = { criarBanco };