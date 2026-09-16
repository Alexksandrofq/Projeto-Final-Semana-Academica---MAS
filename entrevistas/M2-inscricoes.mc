# Entrevista M2 - Inscricoes e lista de espera

- Modulo: M2 - Inscricoes e lista de espera
- Dono: a definir
- Inicio: 2026-09-15
- Contrato: `contrato-api.md`, secao M2 + codigos da secao 6
- Metodo: rodada 1 = perguntas do agente, respostas do usuario; resposta **"consultar requisitos"** ou **"consultar registros"** marca a pergunta como **pendente**; rodada 2 = consulta ao documento de requisitos/registros para resolver os pendentes.
- Regra: toda resposta `?` nasce de uma pergunta desta entrevista. Toda regra da spec precisa de origem (pergunta + resposta) e prova (teste).

---

## Mapeamento de Regras de Negocio (RN)

| Item da Entrevista | Regras de Negocio Mapeadas | Descricao Sintetica |
|---|---|---|
| 1 (P1) | RN-202 | Encerramento de inscricoes 30 minutos antes do 1º encontro (`INSCRICOES_ENCERRADAS`) |
| 2 (P2, P3, P11, P12) | RN-205, RN-216, RN-211, RN-213 | Vagas diretas x lista de espera, recomputo de posicao, convocacao de 2h ao liberar vaga e restricao de confirmacao apenas para convocadas |
| 3 (P3) | RN-204 | Posicao na fila de espera definida por ordem de entrada |
| 4 (P4) | RN-206 | Duplicidade (`JA_INSCRITO`) restrita a inscricoes ativas; cancelada/expirada permite nova inscricao |
| 5 (P5) | RN-207 | Conflito de horario considera apenas inscricoes ativas com vaga (`confirmada` e `convocada`) |
| 6 (P6) | RN-208 | Limite de ate 3 minicursos por participante (palestras nao entram) |
| 7 (P7) | RN-218, RN-219, RN-210, RN-209 | Precedencia de recusa no POST de inscricao (`ATIVIDADE_CANCELADA` -> `INSCRICOES_ENCERRADAS` -> `INSCRICAO_BLOQUEADA` -> `JA_INSCRITO` -> `CONFLITO_DE_HORARIO` -> `LIMITE_DE_MINICURSOS`) |
| 8 (P8, P11, P12, P13) | RN-211, RN-212, RN-213, RN-215 | Permissao de cancelamento pelo dono participante (404 para terceiros), convocacao com prazo de 2h e recusas de confirmacao (`SEM_CONVOCACAO`, `CONVOCACAO_EXPIRADA`) |
| 9 (P9, P14) | RN-206, RN-207, RN-215, RN-220 | Definicao de status ativos/inativos no cancelamento (`INSCRICAO_INATIVA`) e precedencia de validacoes na confirmacao de convocacao |
| 10 (P10, P17) | RN-217 | Cancelamento restrito ate o inicio do 1º encontro (`ATIVIDADE_JA_INICIADA`) e cancelamento em cascata de inscricoes ativas em atividade cancelada |

---

## Pendentes

- **P15 (parcial) - Ordenacao padrao de GET /inscricoes**: ordem padrao da listagem de inscricoes nao especificada no documento de regras (sem regra).
- **P16 - Filtro atividadeId inexistente**: comportamento de `GET /inscricoes?atividadeId=atv_inexistente` (se 200 `[]` ou 404) nao coberto pelas regras (pendente).
- **P18 - Relogio e regras de fuso/arredondamento adicionais**: nao ha regras alem do contrato basico de data/hora (pendente de regra externa).

---

## Rodada 1 - Inscricao, espera, cancelamento e convocacao

Base do contrato:

- `POST /atividades/:id/inscricoes` - participante - 201 `Inscricao` sem corpo.
- `GET /inscricoes` - todos - 200 `[Inscricao]`; participante recebe so as proprias; filtro `?atividadeId=`.
- `GET /inscricoes/:id` - todos - 200 `Inscricao`.
- `POST /inscricoes/:id/cancelamento` - participante - 200 `Inscricao`.
- `POST /inscricoes/:id/confirmacao` - participante - 200 `Inscricao`.
- Status: `confirmada`, `em_espera`, `convocada`, `cancelada`, `expirada`.
- Codigos de M2: `ATIVIDADE_JA_INICIADA`, `ATIVIDADE_CANCELADA`, `INSCRICOES_ENCERRADAS`, `INSCRICAO_BLOQUEADA`, `JA_INSCRITO`, `CONFLITO_DE_HORARIO`, `LIMITE_DE_MINICURSOS`, `INSCRICAO_INATIVA`, `SEM_CONVOCACAO`, `CONVOCACAO_EXPIRADA`.

Perguntas desta rodada:

- **P1 - Janela de inscricao**: ate quando `POST /atividades/:id/inscricoes` e permitido? Qual instante dispara `INSCRICOES_ENCERRADAS`?
  - Resposta: As inscrições encerram 30 minutos antes do início do 1º encontro da atividade. Tentativas a partir deste instante retornam `INSCRICOES_ENCERRADAS`. Capacidade da sala define o limite de vagas diretas antes da lista de espera.
- **P2 - Capacidade e lista de espera**: quando ha vaga, a inscricao nasce `confirmada`; quando lotada, nasce `em_espera`? Existe limite de tamanho para a espera?
  - Resposta: Sim, com vagas nasce confirmada e quando lotada nasce em_espera; limite para a lista de espera não foi estabelecido.
- **P3 - Posicao na espera**: `posicaoNaEspera` e calculada por ordem de entrada? Ao cancelar/expirar alguem antes, as posicoes sao recomputadas?
  - Resposta: Ordem de entrada; posições devem ser recomputadas quando houver cancelamento ou expiração anterior.
- **P4 - Duplicidade**: quais status contam para `JA_INSCRITO`? Uma inscricao `cancelada` ou `expirada` permite nova inscricao na mesma atividade?
  - Resposta: Sim, caso cancelado ou expirado o usuário deve poder se inscrever novamente. Portanto apenas inscrições ativas (confirmada, convocada, em_espera) bloqueiam com `JA_INSCRITO`.
- **P5 - Conflito de horario ao inscrever**: `CONFLITO_DE_HORARIO` compara todos os encontros da atividade nova com quais inscricoes existentes do participante? Conta `confirmada`, `convocada`, `em_espera`, `cancelada`, `expirada`?
  - Resposta: Apenas inscrições `confirmada` e `convocada` contam para verificar conflito de horário.
- **P6 - Limite de minicursos**: qual e o limite de minicursos por participante? Quais status contam para `LIMITE_DE_MINICURSOS`? Palestras entram no limite?
  - Resposta: No máximo 3 minicursos por participante; palestras não entram no limite. Status que contam acompanham ocupação de vaga (confirmada/convocada).
- **P7 - Precedencia ao inscrever**: depois da ordem fixa do contrato (401 -> 403 -> 404 -> corpo -> regras), qual erro vem primeiro entre `ATIVIDADE_CANCELADA`, `INSCRICOES_ENCERRADAS`, `INSCRICAO_BLOQUEADA`, `JA_INSCRITO`, `CONFLITO_DE_HORARIO`, `LIMITE_DE_MINICURSOS`?
  - Resposta: Ordem definida: `ATIVIDADE_CANCELADA` -> `INSCRICOES_ENCERRADAS` -> `INSCRICAO_BLOQUEADA` -> `JA_INSCRITO` -> `CONFLITO_DE_HORARIO` -> `LIMITE_DE_MINICURSOS`.
- **P8 - Cancelamento permitido**: quem pode cancelar uma inscricao? So o dono participante? O que acontece se participante tentar cancelar inscricao de outro participante?
  - Resposta: Somente o dono participante pode cancelar. Se outro participante tentar acessar/cancelar inscrição alheia, responde 404 `NAO_ENCONTRADO`.
- **P9 - Cancelamento por status**: quais status sao ativos para cancelamento? Quando retornar `INSCRICAO_INATIVA`?
  - Resposta: Inscrições ativas para cancelamento são `confirmada`, `em_espera` e `convocada`. Tentar cancelar inscrição com status inativo (`cancelada`, `expirada`) retorna `INSCRICAO_INATIVA`.
- **P10 - Cancelamento por tempo**: cancelar inscricao so e permitido antes da atividade iniciar? Em atividade `em_andamento` ou `encerrada`, retorna `ATIVIDADE_JA_INICIADA`?
  - Resposta: Cancelamento de inscrição é permitido apenas até a atividade começar. A partir do início do primeiro encontro, retorna `ATIVIDADE_JA_INICIADA`.
- **P11 - Efeito do cancelamento na fila**: ao cancelar uma `confirmada` ou `convocada`, a primeira `em_espera` vira `convocada`? Qual prazo de `convocadaAte`?
  - Resposta: 2 horas a partir do instante em que a vaga é liberada.
- **P12 - Confirmacao de convocacao**: `POST /inscricoes/:id/confirmacao` so vale para status `convocada`? Quais status retornam `SEM_CONVOCACAO`?
  - Resposta: Sim, vale somente para status convocada. Qualquer outro status retorna `SEM_CONVOCACAO`.
- **P13 - Expiracao da convocacao**: em qual instante a convocacao expira? Ao expirar, status vira `expirada` automaticamente/lazy? A proxima pessoa da espera e convocada no mesmo momento?
  - Resposta: Tentativa de confirmação após `convocadaAte` retorna `CONVOCACAO_EXPIRADA`.
- **P14 - Regras reavaliadas na confirmacao**: ao confirmar convocacao, reavaliar `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` contra inscricoes atuais? Se falhar, a inscricao fica `convocada`, `expirada` ou outro status?
  - Resposta: Precedência na confirmação definida como: `SEM_CONVOCACAO` -> `CONVOCACAO_EXPIRADA` -> `CONFLITO_DE_HORARIO` -> `LIMITE_DE_MINICURSOS`.
- **P15 - Listagem e detalhe**: qual a ordem de `GET /inscricoes`? Organizacao ve todas; participante ve so as proprias. Em `GET /inscricoes/:id`, participante pode ver inscricao de outro participante ou deve receber `NAO_ENCONTRADO`?
  - Resposta: No detalhe `GET /inscricoes/:id`, participante tentando acessar inscrição de outro participante recebe 404 `NAO_ENCONTRADO`. Ordenação padrão da listagem não coberta pelas regras (pendente).
- **P16 - Filtro `atividadeId`**: filtro por atividade inexistente retorna lista vazia ou `NAO_ENCONTRADO`?
  - Resposta: Não está coberto pelas regras (marcado como pendente).
- **P17 - Cancelamento de atividade vindo do M1**: quando uma atividade e cancelada, quais inscricoes vinculadas mudam para `cancelada`? `expirada` tambem muda?
  - Resposta: Todas as inscrições ativas da atividade (`confirmada`, `em_espera`, `convocada`) viram `cancelada`. Inscrições inativas permanecem inalteradas.
- **P18 - Relogio e datas**: `criadaEm` e `convocadaAte` usam sempre o relogio de teste/sistema? Ha alguma regra especial de fuso ou arredondamento alem do contrato?
  - Resposta: Não está nas regras específicas além do contrato base (marcado como pendente).
