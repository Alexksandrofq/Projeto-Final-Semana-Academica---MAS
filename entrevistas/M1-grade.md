# Entrevista M1 — Grade de atividades

- Módulo: M1 — Grade de atividades
- Dono: (a preencher)
- Início: 2026-09-12
- Contrato: `contrato-api.md`, seção M1 + códigos da seção 6
- Método: rodada 1 = perguntas do agente, respostas do usuário; resposta **"consultar requisitos"** marca a pergunta como **pendente**; rodada 2 = consulta ao documento de requisitos para resolver os pendentes.
- Regra: toda resposta `❓` nasce de uma pergunta desta entrevista. Toda regra da spec precisa de origem (pergunta + resposta) e prova (teste).

---

## Pendentes (rodada 2 concluída — 7 resolvidas, 2 sem resposta no documento)

Do usuário ("responder consultar requisitos") — rodada 1 completa:

- ~~**P1 — Quantidade de encontros**~~ — resolvida: palestra = 1 (RN-102); minicurso 2–5 (RN-103).
- ~~**P2 — Faixa de vagas**~~ — resolvida: vagas 1..capacidade da sala; 0 não aceito (RN-107).
- ~~**P3 — Encontro inválido**~~ — resolvida: duração 1–4 h (RN-104); mesmo dia + período do evento (RN-105); sem sobreposição entre encontros (RN-106).
- ~~**P4 — Conflito de sala**~~ — resolvida: intervalo ≥ 15 min na mesma sala; encostados conflitam; canceladas não contam (RN-108); edição só de título e vagas (RN-110).
- ~~**P5 — Situação**~~ — resolvida: prevista → em_andamento (início do 1º encontro) → encerrada (fim do último); sem tolerância; cancelada prevalece (RN-114).
- ~~**P6 — Listagem e filtros**~~ — resolvida: ordem por 1º encontro, empate por título; canceladas aparecem (RN-115); `dia` = encontro no dia de Brasília, combina com `tipo` (RN-116).
- **P7 — Fronteira do escopo**: `ocupadas/vagasRestantes/emEspera` = 0 no M1?
- ~~**P8 — Carga horária**~~ — resolvida: soma das durações dos encontros em minutos; valor enviado é ignorado (RN-109).
- **P9 — Precedência ao criar**: ordem entre as regras do recurso no POST

---

## Rodada 1 — Criação, listagem e regras básicas

Decisões resolvidas:

1. **Dia e filtro** — `GET /atividades` (contrato: filtros `?dia=AAAA-MM-DD` e `?tipo=palestra|minicurso`). Definir semântica dos filtros, ordem da lista e presença de atividades canceladas.
2. **Dados calculados** — `cargaHorariaMinutos`, `situacao`, `ocupadas`, `vagasRestantes`, `emEspera` (contrato: seção M1).
3. **Regras de criação** — `QUANTIDADE_DE_ENCONTROS`, `ENCONTRO_INVALIDO`, `VAGAS_ACIMA_DA_CAPACIDADE`, `CONFLITO_DE_SALA` (códigos: seção 6).
4. **Precedência entre regras do recurso** — contrato fixa 401→403→404→422 corpo→regras; a ordem interna das regras é decisão.

Perguntas desta rodada:

- **P1 — Quantidade de encontros**: qual o mínimo e o máximo de encontros por atividade? Palestra tem exatamente 1? `QUANTIDADE_DE_ENCONTROS`.
  - ➡️ recomendação: palestra = 1 encontro; minicurso de 1 a N (N no documento de requisitos).
  - Resposta: palestra = exatamente 1 encontro; minicurso = mínimo 2 e máximo 5 encontros.
  - Fonte: RN-102 (palestra = 1 encontro); RN-103 (minicurso 2–5 encontros).
- **P2 — Faixa de vagas**: `vagas` aceita 0 (sem limite)? Qual o piso e o teto? (teto já é capacidade da sala via `VAGAS_ACIMA_DA_CAPACIDADE`).
  - ➡️ recomendação: vagas ≥ 1 e ≤ capacidade da sala.
  - Resposta: vagas no mínimo 1 e no máximo a capacidade da sala; 0 não é aceito como quantidade de vagas.
  - Fonte: RN-107.
- **P3 — Encontro inválido**: quais condições tornam um encontro `ENCONTRO_INVALIDO`? (fim antes do início? fora da semana do evento? fora de janela de horário? sobreposição de encontros da mesma atividade?).
  - ➡️ recomendação: fim > início obrigatório; fora da semana do evento, inválido; detalhes no documento de requisitos.
  - Resposta: inválido se durar menos de 1 hora ou mais de 4 horas; se não começar e terminar no mesmo dia ou estiver fora do período do evento (19–23/10/2026); ou se houver sobreposição entre encontros da mesma atividade.
  - Fonte: RN-104 (duração 1–4 h); RN-105 (mesmo dia + período do evento); RN-106 (sobreposição entre encontros).
- **P4 — Conflito de sala**: o que conta como `CONFLITO_DE_SALA`? Sobreposição só na mesma sala? Tocar borda (uma termina no instante em que outra começa) conflita? Vale só na criação ou também na edição?
  - ➡️ recomendação: conflita quando duas atividades na mesma sala têm instante de horário em comum; borda (fim = início) não conflita; vale na criação e na edição.
  - Resposta: há `CONFLITO_DE_SALA` quando dois encontros usam a mesma sala sem respeitar pelo menos 15 minutos entre o fim de um e o início do outro; horários encostados também conflitam. Encontros de atividades canceladas não contam para o conflito. Após criada, não se altera sala nem encontros, apenas título e vagas.
  - Fonte: RN-108 (intervalo ≥ 15 min na mesma sala; canceladas não contam); RN-110 (edição limita a título e vagas).
- **P5 — Situação**: como computar `prevista | em_andamento | encerrada | cancelada` conforme o relógio anda? Existe tolerância para virar `encerrada`? `ATIVIDADE_JA_INICIADA` e `ATIVIDADE_CANCELADA` dependem disso.
  - ➡️ recomendação: `em_andamento` = agora dentro de algum encontro; `encerrada` = depois do fim do último encontro (tolerância no documento); `cancelada` = via `POST /atividades/:id/cancelamento`; senão `prevista`.
  - Resposta: `prevista` antes do início do primeiro encontro; `em_andamento` no instante em que o primeiro encontro começa; `encerrada` no instante do fim do último encontro. Sem tolerância adicional. `cancelada` prevalece sobre as demais.
  - Fonte: RN-114.
- **P6 — Listagem e filtros**: ordem padrão de `GET /atividades`? Atividades canceladas aparecem? Filtro `dia` = dia civil em que há algum encontro (aparece nos dois dias de um minicurso de 2 encontros)? Filtros combinam?
  - ➡️ recomendação: ordem por início do primeiro encontro; canceladas aparecem com `situacao: cancelada`; `dia` considera qualquer encontro da atividade; `dia`+`tipo` combinam com `E`.
  - Resposta: ordenada pelo início do primeiro encontro (empate por título); canceladas continuam aparecendo. `dia` traz atividades com pelo menos um encontro naquele dia de Brasília (pode aparecer em mais de um dia); `dia` combina com `tipo`.
  - Fonte: RN-115 (ordem + canceladas na listagem); RN-116 (filtro `dia` em Brasília + combinação `dia`×`tipo`).
- **P7 — Fronteira do escopo**: `ocupadas`, `vagasRestantes` e `emEspera` dependem das inscrições (M2). No M1, valem 0 (constantes)?
  - ➡️ recomendação: sim, 0 constantes; o M2 passa a calcular de verdade.
  - Resposta: o documento de requisitos não define que sejam 0 constantes no M1; a questão não está respondida pelas regras do M1 e permanece pendente.
  - Fonte: (sem regra no documento de requisitos).
- **P8 — Carga horária**: `cargaHorariaMinutos` = soma de `fim − inicio` de todos os encontros da atividade, em minutos?
  - ➡️ recomendação: sim, soma das diferenças, ordenado por início.
  - Resposta: `cargaHorariaMinutos` = soma das durações de todos os encontros da atividade, em minutos; se enviado pelo cliente, o valor é ignorado.
  - Fonte: RN-109.
- **P9 — Precedência ao criar**: quando mais de uma regra do recurso recusa o mesmo `POST /atividades`, qual erro vem primeiro?
  - ➡️ recomendação: `QUANTIDADE_DE_ENCONTROS` → `ENCONTRO_INVALIDO` → `VAGAS_ACIMA_DA_CAPACIDADE` → `CONFLITO_DE_SALA`.
  - Resposta: o documento de requisitos não define uma ordem de precedência para os erros do `POST /atividades`; a ordem sugerida não pode ser assumida como regra e permanece pendente.
  - Fonte: (sem regra no documento de requisitos).

---

## Rodada 2 — concluída

Consulta ao documento de requisitos para resolver os pendentes da rodada 1.

Resolvidas (7): P1 (RN-102/RN-103), P2 (RN-107), P3 (RN-104/RN-105/RN-106), P4 (RN-108/RN-110), P5 (RN-114), P6 (RN-115/RN-116), P8 (RN-109).

Permaneceram pendentes (2), sem regra RN atribuída — o documento de requisitos não fornece resposta:

- **P7 — Fronteira do escopo**: `ocupadas`, `vagasRestantes` e `emEspera` valem 0 no M1? (sem regra no documento)
- **P9 — Precedência ao criar**: ordem entre as regras do recurso no `POST /atividades` (sem regra no documento)

Próximos passos: (edição `PATCH`, cancelamento, ordem interna dessas operações, cenários de verificação).