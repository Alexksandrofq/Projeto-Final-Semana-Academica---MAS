Todos os testes passam (25 suítes, 93 testes) e as verificações manuais confirmaram os comportamentos pedidos. Segue o relatório.

---

## O que foi conferido

- Rotas do contrato conferidas: **9 de 9** — as 6 rotas do M1 (`GET /salas`, `GET /atividades`, `GET /atividades/:id`, `POST /atividades`, `PATCH /atividades/:id`, `POST /atividades/:id/cancelamento`) e as 3 do modo de teste (`POST /_teste/reset`, `PUT /_teste/relogio`, `GET /_teste/relogio`).
- Arquivos revisados: `api/src/app.js`, `api/src/banco.js`, `api/src/server.js` e os 25 arquivos de teste em `api/test/`.
- Execução real: `npx jest` em `api/` → **25 suítes, 93 testes, todos passando**. Verificação manual via supertest dos casos pedidos (itens de `encontros`, ordem do PATCH, `tipo`, datas sem fuso, `vagas` fracionada, `salaId` inexistente, `/_teste/*` fora do modo de teste).
- A interface (`interface/`) **não foi revisada** — ficou fora do escopo pedido ("trabalhe somente na pasta `api/`").

## Divergências

1. **[CONVENÇÃO] Datas sem fuso são aceitas e devolvidas** — o contrato exige datas ISO 8601 com fuso (contrato-api.md:13), mas a validação de `inicio`/`fim` usa apenas `Date.parse` (app.js:38), que aceita `"2026-10-19T19:00:00"` sem fuso. Verificação manual: POST com 2 encontros sem fuso → 201, e a resposta devolve `"inicio": "2026-10-19T19:00:00"` sem fuso (app.js:70 devolve `atividade.encontros` como armazenado). Consequência: a API aceita e responde datas fora do formato do contrato; o instante fica ambíguo (interpretado como hora local do servidor). O contrato não mapeia explicitamente "data sem fuso → 422", então o código de retorno para esse caso não está fixado — a divergência é na convenção de formato.

2. **[CONTRATO × SPEC] Identificação nas rotas de leitura** — o contrato exige `X-Usuario` em toda rota, menos `GET /certificados/:codigo` e `/_teste/*` (contrato-api.md:12); a spec M1 diz que "as rotas de leitura (GET, GET `:id`, `/salas`) são liberadas para todos" (specs/M1-grade.md:101, R19). A implementação segue o **contrato**: `GET /salas` (app.js:128-137), `GET /atividades` (app.js:278-285) e `GET /atividades/:id` (app.js:322-329) exigem `X-Usuario` e respondem 401 `USUARIO_DESCONHECIDO` sem ele ou com id inexistente. Registro a divergência contrato × spec com as citações, sem tomar partido de qual deve vencer.

## Pendências da spec assumidas pela implementação

A spec M1 (specs/M1-grade.md:11-19) diz que as decisões pendentes "não viram regra nesta spec — a implementação não deve assumi-las". A implementação assumiu valor ou ordem em todas elas:

- **P7** (`ocupadas`/`vagasRestantes`/`emEspera`): a implementação fixa os três em `0` (app.js:73-75). A spec diz que o valor é pendente e o contrato exige só a presença dos campos (specs/M1-grade.md:13).
- **P9** (precedência no POST): a implementação assume a ordem `VAGAS_ACIMA_DA_CAPACIDADE` (app.js:172-177) → `ENCONTRO_INVALIDO` duração (app.js:185-190) → `ENCONTRO_INVALIDO` período (app.js:194-199) → `ENCONTRO_INVALIDO` sobreposição (app.js:210-217) → `QUANTIDADE_DE_ENCONTROS` (app.js:219-231) → `CONFLITO_DE_SALA` (app.js:244-252). A spec diz que a ordem interna entre regras do recurso fica de fora e não deve ser assumida (specs/M1-grade.md:14, 129).
- **P10 (parte)** (recusa atômica do PATCH com campos mistos): a implementação recusa tudo se qualquer campo não editável estiver presente (app.js:385-390), mesmo com `titulo`/`vagas` válidos no mesmo corpo.
- **P11** (restrição temporal do PATCH): a implementação **não** restringe PATCH em atividade `em_andamento`/`encerrada` — altera `titulo`/`vagas` normalmente (app.js:392-412). Assumiu "sem restrição".
- **P14** (PATCH com corpo `{}`, título vazio, limite de caracteres): a implementação aceita corpo `{}` → 200 inalterado (verificação manual; app.js:363-414 não recusa corpo vazio), aceita `titulo: ""` e não limita caracteres.
- **P15** (precedência no PATCH): a implementação assume `ATIVIDADE_CANCELADA` (app.js:378-383) → `CAMPO_NAO_EDITAVEL` (app.js:385-390) → `VAGAS_ACIMA_DA_CAPACIDADE` (app.js:403-409). A spec diz que essa ordem não deve ser assumida (specs/M1-grade.md:18, 129).
- **P17 (parte)** (corpo no cancelamento): a implementação ignora o corpo do cancelamento (app.js:417-460 não lê `req.body`). Assumiu "ignorado".
- **R3** (código para `vagas < 1` pendente): a implementação fixou `DADOS_INVALIDOS` com mensagem "(código específico pendente)" no POST (app.js:164-169) e no PATCH (app.js:397-402). A spec diz que o código fica pendente (specs/M1-grade.md:69).

## Conformidades

- **Ordem das verificações no PATCH** (contrato-api.md:17): 401 (app.js:341-347) → 403 (app.js:348-353) → 404 (app.js:355-361) → corpo 422 `DADOS_INVALIDOS` (app.js:363-376) → regras do recurso. Confirmado que `DADOS_INVALIDOS` vem **antes** de `ATIVIDADE_CANCELADA` (app.js:378-383) — verificação manual e teste m1-r15-r8-r10.test.js:52-62.
- **Itens de `encontros` no POST**: `[{}]`, `[{inicio:"x", fim:"y"}]` e `[null]` → 422 `DADOS_INVALIDOS` sem erro interno (app.js:31-41; verificação manual). `encontros: []` → 422 `QUANTIDADE_DE_ENCONTROS` (app.js:219-231) — coberto pelo contrato (código listado em contrato-api.md:267) e pela spec R1/R2 (specs/M1-grade.md:67-68).
- **Domínio de `tipo`**: `palestra|minicurso` validado no corpo do POST antes das regras de recurso (app.js:19-21, 154-160); `tipo: "oficina"` → 422 `DADOS_INVALIDOS` (verificação manual).
- **SQLite real**: `banco.js` usa `better-sqlite3` (banco.js:1); não há `new Map()` em `app.js`. `POST /_teste/reset` apaga atividades e recarrega dados iniciais (banco.js:143-149); cada `criarServidor()` em MODO_TESTE usa `:memory:` isolado (banco.js:47-48); fora do modo de teste usa arquivo `api/semana.db` ancorado em `__dirname`, `DB_ARQUIVO` ou `arquivoBanco` (banco.js:43-51). Persistência em arquivo comprovada por teste (m1-persistencia.test.js:39-62).
- **Modo de teste**: relógio parado em `2026-10-13T09:00:00-03:00` (app.js:100), `PUT`/`GET /_teste/relogio` (app.js:113-126), `/_teste/*` → 404 sem `MODO_TESTE` (app.js:105-106, 114-115, 122-123; verificação manual).
- **Dados iniciais**: 10 usuários com papéis corretos (banco.js:11-22) e 4 salas com capacidades corretas (banco.js:4-9) — batem com contrato-api.md:61-79.
- **Códigos de retorno do M1**: `USUARIO_DESCONHECIDO` 401, `SOMENTE_ORGANIZACAO` 403, `NAO_ENCONTRADO` 404, `DADOS_INVALIDOS` 422, `QUANTIDADE_DE_ENCONTROS` 422, `ENCONTRO_INVALIDO` 422, `VAGAS_ACIMA_DA_CAPACIDADE` 422, `CONFLITO_DE_SALA` 409, `CAMPO_NAO_EDITAVEL` 422, `ATIVIDADE_JA_INICIADA` 422, `ATIVIDADE_CANCELADA` 422 — todos com corpo `{"erro": ..., "mensagem": ...}` (contrato-api.md:15).
- **Convenções**: IDs `atv_`/`enc_` + 8 hex minúsculos (app.js:5-7); `encontros` em ordem de início (app.js:254-256); `cargaHorariaMinutos` calculado (app.js:258-261); `situacao` calculado pelo relógio (app.js:45-61); shape de `Atividade` com os 11 campos (app.js:63-77); shape de `Sala` (banco.js:90-91); filtros `?dia=` e `?tipo=` (app.js:286-307); ordenação por início do 1º encontro com empate por título (app.js:309-316).
- **JSON malformado**: sem usuário válido → 401 (identificação primeiro), com usuário válido → 422 `DADOS_INVALIDOS` (app.js:462-476) — consistente com a ordem do contrato (contrato-api.md:16-17).

## Observações (não são divergência)

- **R14 (`VAGAS_ABAIXO_DOS_INSCRITOS`) não é implementada nem testada** — a regra existe na spec (specs/M1-grade.md:90) e o código está no contrato (contrato-api.md:272), mas depende de inscrições do M2; sem elas, não há como violá-la. O critério de aceite 14 da spec usa inscrições do M2 (specs/M1-grade.md:118).
- **`vagas` fracionada é aceita**: `vagas: 1.5` → 201 (verificação manual; app.js:25 e 371 só checam `typeof number`). A spec diz "inteiro ≥ 1" (specs/M1-grade.md:37), mas o contrato não explicita inteiro — por isso não classifiquei como divergência de contrato.
- **`salaId` inexistente é aceito**: POST com `salaId: "sala-inexistente"` → 201 (verificação manual; app.js:171 usa `?.capacidade` e segue se a sala não existe). O contrato e a spec M1 não têm regra de existência de sala.
- **CORS e `OPTIONS` 204** (app.js:84-94) são comportamento extra não previsto no contrato, mas não conflitam com nenhuma rota/código dele.
- **`POST /_teste/reset` "apaga tudo"** (contrato-api.md:47) na prática apaga só `atividades`; salas/usuários são recarregados com `INSERT OR IGNORE` (banco.js:77-88, 143-149). Como não há rota para criar usuário/sala, o estado observável após o reset é idêntico ao inicial.
- **`PUT /_teste/relogio` com `agora` inválido** deixaria o relógio em `Invalid Date` (app.js:117) e `toISOString()` lançaria erro; o contrato não cobre esse caso e o juiz sempre envia ISO válido.

## Veredito

A implementação do M1 está **conforme o contrato** nas rotas, métodos, códigos de retorno, cabeçalhos, modo de teste e persistência SQLite — com uma divergência de convenção (datas sem fuso aceitas e devolvidas, contrato-api.md:13 × app.js:38) e a divergência documentada contrato × spec sobre identificação nas rotas de leitura (contrato-api.md:12 × specs/M1-grade.md:101). Para estar plenamente conforme, falta apenas tratar o formato de data com fuso na validação de corpo; as demais pendências (P7/P9/P10/P11/P14/P15/P17, código de `vagas < 1`, R14) são pendências da spec que a implementação assumiu, não divergências contra o contrato.