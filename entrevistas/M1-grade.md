# Entrevista M1 — Grade de atividades

- Módulo: M1 — Grade de atividades
- Dono: (a preencher)
- Início: 2026-09-12
- Contrato: `contrato-api.md`, seção M1 + códigos da seção 6
- Método: rodada 1 = perguntas do agente, respostas do usuário; resposta **"consultar requisitos"** marca a pergunta como **pendente**; rodada 2 = consulta ao documento de requisitos para resolver os pendentes.
- Regra: toda resposta `❓` nasce de uma pergunta desta entrevista. Toda regra da spec precisa de origem (pergunta + resposta) e prova (teste).

---

## Pendentes para a rodada 2

Do usuário ("responder consultar requisitos") — rodada 1 completa:

- **P1 — Quantidade de encontros**: mínimo/máximo de encontros por atividade; palestra = 1?
- **P2 — Faixa de vagas**: `vagas` aceita 0? piso/teto?
- **P3 — Encontro inválido**: condições de `ENCONTRO_INVALIDO`
- **P4 — Conflito de sala**: definição de `CONFLITO_DE_SALA`
- **P5 — Situação**: como computar `prevista/em_andamento/encerrada/cancelada`; tolerância para `encerrada`
- **P6 — Listagem e filtros**: ordem, canceladas na lista, semântica de `dia`, combinação de filtros
- **P7 — Fronteira do escopo**: `ocupadas/vagasRestantes/emEspera` = 0 no M1?
- **P8 — Carga horária**: soma de `fim − inicio`?
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
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P2 — Faixa de vagas**: `vagas` aceita 0 (sem limite)? Qual o piso e o teto? (teto já é capacidade da sala via `VAGAS_ACIMA_DA_CAPACIDADE`).
  - ➡️ recomendação: vagas ≥ 1 e ≤ capacidade da sala.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P3 — Encontro inválido**: quais condições tornam um encontro `ENCONTRO_INVALIDO`? (fim antes do início? fora da semana do evento? fora de janela de horário? sobreposição de encontros da mesma atividade?).
  - ➡️ recomendação: fim > início obrigatório; fora da semana do evento, inválido; detalhes no documento de requisitos.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P4 — Conflito de sala**: o que conta como `CONFLITO_DE_SALA`? Sobreposição só na mesma sala? Tocar borda (uma termina no instante em que outra começa) conflita? Vale só na criação ou também na edição?
  - ➡️ recomendação: conflita quando duas atividades na mesma sala têm instante de horário em comum; borda (fim = início) não conflita; vale na criação e na edição.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P5 — Situação**: como computar `prevista | em_andamento | encerrada | cancelada` conforme o relógio anda? Existe tolerância para virar `encerrada`? `ATIVIDADE_JA_INICIADA` e `ATIVIDADE_CANCELADA` dependem disso.
  - ➡️ recomendação: `em_andamento` = agora dentro de algum encontro; `encerrada` = depois do fim do último encontro (tolerância no documento); `cancelada` = via `POST /atividades/:id/cancelamento`; senão `prevista`.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P6 — Listagem e filtros**: ordem padrão de `GET /atividades`? Atividades canceladas aparecem? Filtro `dia` = dia civil em que há algum encontro (aparece nos dois dias de um minicurso de 2 encontros)? Filtros combinam?
  - ➡️ recomendação: ordem por início do primeiro encontro; canceladas aparecem com `situacao: cancelada`; `dia` considera qualquer encontro da atividade; `dia`+`tipo` combinam com `E`.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P7 — Fronteira do escopo**: `ocupadas`, `vagasRestantes` e `emEspera` dependem das inscrições (M2). No M1, valem 0 (constantes)?
  - ➡️ recomendação: sim, 0 constantes; o M2 passa a calcular de verdade.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P8 — Carga horária**: `cargaHorariaMinutos` = soma de `fim − inicio` de todos os encontros da atividade, em minutos?
  - ➡️ recomendação: sim, soma das diferenças, ordenado por início.
  - Resposta: consultar requisitos — pendente (rodada 2)
- **P9 — Precedência ao criar**: quando mais de uma regra do recurso recusa o mesmo `POST /atividades`, qual erro vem primeiro?
  - ➡️ recomendação: `QUANTIDADE_DE_ENCONTROS` → `ENCONTRO_INVALIDO` → `VAGAS_ACIMA_DA_CAPACIDADE` → `CONFLITO_DE_SALA`.
  - Resposta: consultar requisitos — pendente (rodada 2)

---

## Rodada 2 — a definir

(edição `PATCH`, cancelamento, ordem interna dessas operações, cenários de verificação)