# Spec — M1 Grade de atividades

Origem: `entrevistas/M1-grade.md` (rodadas 1, 2 e 1B concluídas). Contrato: seção M1 e códigos da seção 6 de `contrato-api.md`.

## 1. Objetivo

Permitir que a organização monte a grade de atividades da Semana Acadêmica (palestras e minicursos, com sala, vagas e encontros), que o sistema valide o cadastro e a alteração segundo as regras de negócio, e que qualquer usuário consulte a grade e a situação de cada atividade. A pecificação segue o contrato em rota, campo e código de retorno.

## 2. Fora de escopo

Decisões ainda **pendentes** depois das rodadas 2 não viram regra nesta spec — a implementação não deve assumi-las:

- **P7** — valor de `ocupadas`, `vagasRestantes` e `emEspera` no M1 (documento de requisitos não define; o que o contrato exige é só a presença dos campos na resposta).
- **P9** — precedência entre regras do recurso no `POST /atividades` (`QUANTIDADE_DE_ENCONTROS`, `ENCONTRO_INVALIDO`, `VAGAS_ACIMA_DA_CAPACIDADE`, `CONFLITO_DE_SALA`).
- **P10 (parte)** — recusa atômica do PATCH quando o corpo mistura campos editáveis e não editáveis.
- **P11** — restrição temporal do PATCH em atividade `em_andamento` ou `encerrada`.
- **P14** — PATCH com corpo `{}`; título vazio/em branco; limite de caracteres do título (em POST e PATCH).
- **P15** — precedência entre regras no PATCH (`ATIVIDADE_CANCELADA`, `CAMPO_NAO_EDITAVEL`, `VAGAS_ACIMA_DA_CAPACIDADE`, `VAGAS_ABAIXO_DOS_INSCRITOS`).
- **P17 (parte)** — corpo enviado no cancelamento: ignorado ou recusado.

Também não faz parte do M1:

- **Efeito do cancelamento nas inscrições** (cancelar inscrições ativas) — é do M2 (RN-217).
- **Criação de usuários e salas** — dados iniciais do contrato (seção 4); não há rota para isso.
- **Demais módulos** (M2 inscrições, M3 presença, M4 certificados, M5 painel).

## 3. Modelo

### Atividade (resposta de GET/POST/PATCH/cancelamento)

| Campo | Tipo | Origem |
|---|---|---|
| `id` | string `atv_` + 8 hex | gerado |
| `titulo` | string | informado |
| `tipo` | `palestra` \| `minicurso` | informado |
| `salaId` | string | informado |
| `vagas` | inteiro ≥ 1 | informado (limites: R3, R4) |
| `encontros` | `[{ id, inicio, fim }]` em ordem de início | informado; `id` (`enc_` + 8 hex) gerado |
| `cargaHorariaMinutos` | inteiro | calculado (R12); valor enviado é ignorado |
| `situacao` | `prevista` \| `em_andamento` \| `encerrada` \| `cancelada` | calculado (R9) — derivado, não é guardado |
| `ocupadas`, `vagasRestantes`, `emEspera` | inteiro | calculado — **valor no M1 pendente (P7); nenhuma regra nesta spec** |

### Sala (dados iniciais, sem rota de criação)

| Campo | Tipo |
|---|---|
| `id`, `nome` | string |
| `capacidade` | inteiro |

## 4. Endpoints

Rotas, perfis e status de sucesso conforme contrato (M1); as recusas de regras estão nas Regras.

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| GET | `/salas` | todos | 200 `[Sala]` |
| GET | `/atividades` | todos | 200 `[Atividade]` — filtros `?dia=AAAA-MM-DD` e `?tipo=palestra\|minicurso` |
| GET | `/atividades/:id` | todos | 200 `Atividade` |
| POST | `/atividades` | organização | 201 `Atividade` |
| PATCH | `/atividades/:id` | organização | 200 `Atividade` |
| POST | `/atividades/:id/cancelamento` | organização | 200 `Atividade` |

## 5. Regras

### Criação (`POST /atividades`)

- **R1** (P1, RN-102): atividade de `tipo: palestra` deve ter exatamente 1 encontro. Número diferente → `QUANTIDADE_DE_ENCONTROS` (422).
- **R2** (P1, RN-103): atividade de `tipo: minicurso` deve ter de 2 a 5 encontros. Fora dessa faixa → `QUANTIDADE_DE_ENCONTROS` (422).
- **R3** (P2, RN-107): `vagas` mínima é 1; `vagas: 0` não é aceita no POST nem no PATCH (a recusa abaixo de 1 é recusada, mas o código do erro fica **pendente** — o documento de requisitos não fixa um código para vagas abaixo de 1).
- **R4** (P2, RN-107): `vagas` máxima é a capacidade da sala (`salaId`). Acima → `VAGAS_ACIMA_DA_CAPACIDADE` (422), no POST e no PATCH.
- **R5** (P3, RN-104): cada encontro deve durar entre 1 e 4 horas (`fim − inicio`). Duração menor ou maior → `ENCONTRO_INVALIDO` (422).
- **R6** (P3, RN-105): cada encontro deve começar e terminar no mesmo dia civil e dentro do período do evento (19 a 23 de outubro de 2026, horário de Brasília). Fora disso → `ENCONTRO_INVALIDO` (422).
- **R7** (P3, RN-106): encontros da mesma atividade não podem se sobrepor. Sobreposição → `ENCONTRO_INVALIDO` (422).
- **R8** (P4, RN-108): dois encontros que usam a mesma sala precisam de pelo menos 15 minutos entre o fim de um e o início do outro; horários encostados (fim de um = início do outro) conflitam. Encontros de atividades canceladas não contam para o conflito. Violação → `CONFLITO_DE_SALA` (409).
- **R19** (P19, RN-101): `POST /atividades` exige papel `organizacao` (participante → `SOMENTE_ORGANIZACAO`, 403). Não há dono individual: qualquer organização opera qualquer atividade.

### Situação e cálculo (presentes em todas as respostas `Atividade`)

- **R9** (P5, RN-114): `situacao` segue o relógio (no modo de teste, o relógio `_teste`): `prevista` antes do início do 1º encontro; `em_andamento` a partir do instante em que o 1º encontro começa; `encerrada` a partir do instante do fim do último encontro. Sem tolerância adicional. `cancelada` prevalece sobre as demais.
- **R12** (P8, RN-109): `cargaHorariaMinutos` = soma das durações (`fim − inicio`) de todos os encontros, em minutos. Se enviado pelo cliente, o valor é ignorado.

### Listagem (`GET /atividades`)

- **R10** (P6, RN-115): lista em ordem crescente do início do 1º encontro; empate por `titulo`. Atividades canceladas continuam aparecendo (com `situacao: cancelada`).
- **R11** (P6, RN-116): filtro `dia=AAAA-MM-DD` traz atividades com pelo menos um encontro naquele dia civil (horário de Brasília); atividade com encontros em vários dias aparece em todos eles. `dia` combina com `tipo` (ambos devem valer).

### Alteração (`PATCH /atividades/:id`)

- **R13** (P10, RN-110): depois de criada, apenas `titulo` e `vagas` são editáveis. Enviar `tipo`, `salaId` ou `encontros` → `CAMPO_NAO_EDITAVEL` (422).
- **R14** (P12, RN-111): redução de `vagas` é negada se o novo valor ficar abaixo do total de inscrições `confirmada` + `convocada` (as que ocupam vaga) → `VAGAS_ABAIXO_DOS_INSCRITOS` (409). Inscrições `em_espera` não entram na contagem (não impedem a redução).
- **R15** (P13, RN-113): PATCH em atividade `cancelada` → `ATIVIDADE_CANCELADA` (422), independentemente dos campos enviados.

### Cancelamento (`POST /atividades/:id/cancelamento`)

- **R16** (P16, RN-112): o cancelamento só é permitido antes do início do 1º encontro. A partir do instante de início (inclusive) — atividade `em_andamento` ou `encerrada` — → `ATIVIDADE_JA_INICIADA` (422).
- **R17** (P17, RN-113): cancelar atividade já `cancelada` → `ATIVIDADE_CANCELADA` (422).
- **R18** (P18, RN-217): no M1, o cancelamento muda apenas `situacao` da atividade para `cancelada`. O efeito nas inscrições (cancelar as inscrições ativas) é do M2.

### Autorização

- **R19** (P19, RN-101): nas rotas de escrita (POST, PATCH, cancelamento) o papel é `organizacao` — participante → `SOMENTE_ORGANIZACAO` (403). As rotas de leitura (GET, GET `:id`, `/salas`) são liberadas para todos. Não há dono ou criador individual: qualquer organização opera qualquer atividade. Não há regra adicional entre usuários com papel organização.

## 6. Critérios de aceite

1. (R1, R2, R19) `POST /atividades` de `palestra` com 2 encontros, ou de `minicurso` com 1 encontro → 422 `QUANTIDADE_DE_ENCONTROS`; `GET /atividades` não lista a atividade recusada. Feito por `p-carla` → 403 `SOMENTE_ORGANIZACAO` antes da 422.
2. (R2) `minicurso` com 2 encontros válidos → 201; com 6 encontros → 422 `QUANTIDADE_DE_ENCONTROS`.
3. (R3, R4) POST com `vagas: 0` → recusa (422, código **pendente**); POST com `vagas: 41` na `sala-101` (capacidade 40) → 422 `VAGAS_ACIMA_DA_CAPACIDADE`. O mesmo vale no PATCH.
4. (R5) encontro com duração de 38 min ou de 5 h → 422 `ENCONTRO_INVALIDO`.
5. (R6) encontro terminando em dia diferente do início, ou fora de 19–23/10/2026 → 422 `ENCONTRO_INVALIDO`.
6. (R7) dois encontros da mesma atividade com sobreposição (fim de um após o início do outro) → 422 `ENCONTRO_INVALIDO`.
7. (R8) atividade A na `sala-101` das 19:00–22:00 e outra atividade na mesma sala a partir das 22:00 (encostado, intervalo 0 < 15 min) → 409 `CONFLITO_DE_SALA`; com início às 22:15 (intervalo de 15 min) → 201.
8. (R8) atividade cancelada com encontro na mesma sala não gera `CONFLITO_DE_SALA` para a nova atividade → 201.
9. (R9) Com `POST /_teste/reset` (relógio `2026-10-13T09:00:00-03:00`): atividade prevista → `situacao: prevista`; `PUT /_teste/relogio` no instante de início do 1º encontro → `em_andamento`; no instante do fim do último → `encerrada`; mesma atividade cancelada com relógio antes do início → `situacao: cancelada` (prevalece).
10. (R10) `GET /atividades` ordena pelo início do 1º encontro (empate por `titulo`) e inclui atividade cancelada com `situacao: cancelada`.
11. (R11) minicurso com encontros em 19/10 e 20/10 (Brasília) aparece em `?dia=2026-10-19` e em `?dia=2026-10-20`; `?dia=2026-10-19&tipo=minicurso` traz só o minicurso e `?tipo=palestra` não o traz.
12. (R12) minicurso com dois encontros de 3 h → `cargaHorariaMinutos: 360`; enviar `cargaHorariaMinutos: 999` no POST é ignorado → 201 com 360.
13. (R13) PATCH com `salaId` ou `encontros` → 422 `CAMPO_NAO_EDITAVEL`; PATCH só com `titulo`/`vagas` → 200 e `GET /atividades/:id` reflete a alteração.
14. (R14) Com inscrições do M2 ocupando vaga (2 `confirmada` + 1 `convocada`): PATCH `vagas: 3` → 200; `vagas: 2` → 409 `VAGAS_ABAIXO_DOS_INSCRITOS`; com 5 `em_espera` e as mesmas 2 confirmadas, `vagas: 2` continua permitido (espera não bloqueia).
15. (R15) PATCH (mesmo só com `titulo`) em atividade `cancelada` → 422 `ATIVIDADE_CANCELADA`.
16. (R16) cancelamento com relógio no instante de início do 1º encontro ou depois (inclusive encerrada) → 422 `ATIVIDADE_JA_INICIADA`; com relógio antes → 200 e `situacao: cancelada`.
17. (R17) segunda chamada de cancelamento → 422 `ATIVIDADE_CANCELADA`.
18. (R18) após cancelamento, `GET /atividades/:id` mostra `situacao: cancelada`; nada além de `situacao` muda no M1 (efeito nas inscrições fica para o M2).
19. (R19) `org-bruno` consegue alterar e cancelar atividade criada por `org-ana` (sem dono); `p-carla` recebe 403 `SOMENTE_ORGANIZACAO` nas rotas de escrita e 200 nas de leitura.

## 7. Como isto será verificado

Pela costura mais externa que existe: **HTTP contra a API no modo de teste** (`MODO_TESTE=1`), chamando os endpoints do contrato seção M1. Cada teste começa com `POST /_teste/reset` (dados iniciais + relógio em `2026-10-13T09:00:00-03:00`) e usa `PUT /_teste/relogio` para as regras dependentes de tempo (R9, R16), pois no modo de teste o relógio fica parado.

Ordem das verificações segue o contrato: identificação (401) → perfil (403 `SOMENTE_ORGANIZACAO`) → existência da atividade (404 `NAO_ENCONTRADO`) → corpo (`DADOS_INVALIDOS`) → regras do recurso. **A ordem interna entre regras do recurso fica de fora** (P9 para o POST, P15 para o PATCH) e não deve ser testada nem assumida.

O repositório ainda não tem implementação: a primeira fatia cria a cota usando a API (`criarServidor()` ou equivalente da stack escolhida), tornando os critérios acima executáveis.

## 8. Fatias de entrega

- **Fatia 1 — Criação estrutural** (R1, R2, R3, R4, R5, R6, R7, R19 em POST): criar atividade válida (201) e recusar quantidade de encontros, vagas fora da faixa e encontro inválido, com `SOMENTE_ORGANIZACAO` garantido. Inclui `GET /atividades` e `GET /atividades/:id` básicos.
- **Fatia 2 — Conflito de sala** (R8): regra dos 15 minutos, encostados e canceladas fora do cálculo.
- **Fatia 3 — Calculados e relógio** (R9, R12): `cargaHorariaMinutos` e `situacao` computados com o relógio de teste.
- **Fatia 4 — Listagem e filtros** (R10, R11): ordem, presença de canceladas, `dia` (Brasília) e combinação com `tipo`.
- **Fatia 5 — PATCH** (R13, R14, R15): campos editáveis, `VAGAS_ABAIXO_DOS_INSCRITOS` e bloqueio de cancelada.
- **Fatia 6 — Cancelamento** (R16, R17, R18): janela de cancelamento, duplo cancelamento e efeito só em `situacao` (no M1).