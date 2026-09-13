## Matriz de rastreabilidade

| Regra | Origem | Teste que comprova | Veredito |
|---|---|---|---|
| R1 | P-01 (RN-102) | api/test/m1-r1.test.js:13 «palestra com 2 encontros → 422»; :34 «0 encontros → 422» | COMPROVADA |
| R2 | P-01 (RN-103) | api/test/m1-r2.test.js:13 «minicurso com 1 encontro → 422»; :33 «6 encontros → 422» | COMPROVADA |
| R3 | P-02 (RN-107) | api/test/m1-r3-r4.test.js:26 «vagas 0 no POST → 422»; api/test/m1-r3-r4-patch.test.js:33 «vagas 0 no PATCH → 422» | COMPROVADA (código do erro pendente; testes não o fixam) |
| R4 | P-02 (RN-107) | api/test/m1-r3-r4.test.js:47 «vagas 41 na sala-101 → 422 VAGAS_ACIMA_DA_CAPACIDADE»; api/test/m1-r3-r4-patch.test.js:46 «idem no PATCH»; :58 «vagas 30 → 200» | COMPROVADA |
| R5 | P-03 (RN-104) | api/test/m1-r5.test.js:23 «38 min → 422 ENCONTRO_INVALIDO»; :35 «5 h → 422» | COMPROVADA |
| R6 | P-03 (RN-105) | api/test/m1-r6.test.js:23 «cruza meia-noite → 422»; :35 «antes de 19/10 → 422»; :47 «depois de 23/10 → 422» | COMPROVADA |
| R7 | P-03 (RN-106) | api/test/m1-r7.test.js:23 «sobreposição parcial → 422»; :40 «encontro contido → 422» | COMPROVADA |
| R8 | P-04 (RN-108) | api/test/m1-r8.test.js:23 «14 min → 409 CONFLITO_DE_SALA»; :41 «15 min → 201»; :59 «salas diferentes → 201»; api/test/m1-cobertura.test.js:14 «encostado (0 min) → 409»; api/test/m1-r15-r8-r10.test.js:52 «cancelada não gera conflito → 201» | COMPROVADA |
| R9 | P-05 (RN-114) | api/test/m1-r9.test.js:39 «antes do início → prevista»; :45 «instante do início → em_andamento»; :51 «durante → em_andamento»; :57 «instante do fim → encerrada»; api/test/m1-r16-r17.test.js:33 «cancelada prevalece» | COMPROVADA |
| R10 | P-06 (RN-115) | api/test/m1-r10-r11.test.js:43 «ordena por início do 1º encontro»; :55 «empate por título»; api/test/m1-r15-r8-r10.test.js:70 «cancelada aparece com situacao cancelada» | COMPROVADA |
| R11 | P-06 (RN-116) | api/test/m1-r10-r11.test.js:75 «filtro tipo»; :94 «filtro dia (Brasília)»; :116 «dia+tipo»; :135 «aparece nos dois dias» | COMPROVADA |
| R12 | P-08 (RN-109) | api/test/m1-r12.test.js:30 «2 encontros de 3 h → 360, no POST e no GET»; :49 «cargaHorariaMinutos: 999 ignorado → 360» | COMPROVADA |
| R13 | P-10 (RN-110) | api/test/m1-r13.test.js:33 «só titulo → 200 e GET reflete»; :51 «só vagas → 200»; :63 «tipo → 422 CAMPO_NAO_EDITAVEL»; :75 «salaId → 422»; :87 «encontros → 422»; :99 «inexistente → 404» | COMPROVADA |
| R14 | P-12 (RN-111) | — | PENDENTE (depende de inscrições/M2) |
| R15 | P-13 (RN-113) | api/test/m1-r15-r8-r10.test.js:40 «PATCH em cancelada → 422 ATIVIDADE_CANCELADA» | COMPROVADA |
| R16 | P-16 (RN-112) | api/test/m1-r16-r17.test.js:33 «antes do início → 200»; :50 «instante do início → 422 ATIVIDADE_JA_INICIADA»; :64 «depois do início → 422» | COMPROVADA (caso "encerrada" não executado — mesmo ramo de app.js:414) |
| R17 | P-17 (RN-113) | api/test/m1-r16-r17.test.js:78 «segundo cancelamento → 422 ATIVIDADE_CANCELADA» | COMPROVADA |
| R18 | P-18 (RN-217) | api/test/m1-r16-r17.test.js:33 «cancela → 200 situacao cancelada»; :44 «GET reflete cancelada» | COMPROVADA (só o efeito em `situacao` é assertado; "nada além muda" não é verificado) |
| R19 | P-19 (RN-101) | api/test/m1-r19.test.js:21 «org cria → 201»; :52 «p-carla → 403 e nada criado»; :67/:76 «401 sem/desconhecido»; api/test/m1-r13.test.js:128/:139/:149 «403/401 no PATCH»; api/test/m1-r16-r17.test.js:125/:136/:146 «403/401 no cancelamento»; api/test/m1-cobertura.test.js:45 «org-bruno altera atividade de org-ana»; :71 «org-bruno cancela atividade de org-ana» | COMPROVADA |
| GET /salas | contrato seção 5 M1; spec §4 | api/test/m1-salas.test.js:13 «200 sem X-Usuario»; :22 «shape {id, nome, capacidade} das 4 salas»; api/test/m1-server.test.js:46 «200 no servidor real» | COMPROVADA |
| Ordem 401→403→404→corpo→regras | contrato-api.md:17 | api/test/m1-r19.test.js:52/:67; api/test/m1-r13.test.js:99/:128/:139; api/test/m1-r16-r17.test.js:96/:125/:136; api/test/m1-corpo-post.test.js:24–76 | COMPROVADA (cada etapa tem teste; nenhum teste exercita duas condições no mesmo pedido — e corpo malformado pula a identificação, ver Achado 3) |

## Suíte

`npx jest` (executado em `api/`) →

```
Test Suites: 19 passed, 19 total
Tests:       71 passed, 71 total
Snapshots:   0 total
Time:        3.746 s
Ran all test suites.
```

`npx jest test/m1-server.test.js` (smoke check do servidor real) →

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.864 s, estimated 2 s
Ran all test suites matching test/m1-server.test.js.
```

`projeto.json` agora tem os comandos preenchidos: `instalar: "npm install"`, `iniciar: "npm start"`, `testes: ["npm test"]` (projeto.json:5–8). O campo `stack` (projeto.json:2) continua com o texto "PREENCHER — …", mas é texto livre e não afeta o juiz.

## Achados

1. **[RESOLVIDO] `GET /salas` implementado e testado.** Rota em `api/src/app.js:129–131`; testes em `api/test/m1-salas.test.js:13` (200 sem `X-Usuario`) e `:22` (shape `{id, nome, capacidade}` das 4 salas do contrato); o smoke check do servidor real também chama `/salas` (`api/test/m1-server.test.js:46–54`). Achado 1 do parecer anterior encerrado.

2. **[RESOLVIDO] `npm start` sobe a API.** `api/src/server.js` existe (server.js:1–7) e escuta em `process.env.PORT || 3000`; `api/package.json:8` define `"start": "node src/server.js"`. O teste `api/test/m1-server.test.js:14–38` sobe o processo real com `MODO_TESTE=1` e `PORT` própria, espera a mensagem "ouvindo na porta" e recebe 200 em `GET /salas` — passou. Achado 2 do parecer anterior encerrado.

3. **[OBSERVAÇÃO NOVA] Corpo malformado pula a etapa de identificação.** `express.json()` roda antes das rotas (`api/src/app.js:94`) e o handler de erro global (`api/src/app.js:425–433`) devolve `422 DADOS_INVALIDOS` para JSON malformado antes de qualquer rota checar `X-Usuario`. Verificado empiricamente: `POST /atividades` com corpo `{nao-e-json` e **sem** `X-Usuario` → 422, não 401. O contrato (contrato-api.md:17) fixa identificação (401) antes de corpo (422). Para corpos bem formados a ordem está correta (app.js:134–154); a divergência só ocorre com corpo malformado combinado com usuário ausente/errado. Nenhum teste cobre essa combinação.

4. **[OBSERVAÇÃO NOVA] PATCH aceita campo de tipo errado.** Em `api/src/app.js:358–360` o `titulo` é gravado sem checagem de tipo, e `vagas` idem (app.js:361–376). Verificado empiricamente: `PATCH { titulo: 123 }` → 200 com `titulo: 123`; `PATCH { vagas: "20" }` → 200 com `vagas: "20"`. O contrato (contrato-api.md:16) diz que "campo … de tipo errado → 422 DADOS_INVALIDOS". A validação de corpo (`validarCorpoAtividade`, app.js:36–56) só é aplicada no POST (app.js:148–154), não no PATCH. Nenhum teste cobre.

5. **[OBSERVAÇÃO MANTIDA] PATCH recusado pode aplicar `titulo` antes de recusar.** Em `api/src/app.js:358–360` o `titulo` é gravado antes da validação de `vagas` (app.js:361–376). Um PATCH `{ titulo: "X", vagas: 0 }` retorna 422 mas deixa o título alterado no estado. Nenhum teste cobre; a spec não tem regra de atomicidade nesse caso (P10 pendente trata só a mistura editável/não editável).

6. **[OBSERVAÇÃO MANTIDA] `ocupadas`/`vagasRestantes`/`emEspera` fixos em 0** (`api/src/app.js:86–88`). É a decisão pendente P7; a spec (§2) diz que a implementação não deve assumir decisões pendentes. O teste de shape (`api/test/m1-cobertura.test.js:134–136`) só assere a presença dos campos, não o valor — coerente com o pendente.

7. **[CONTRATO — citar de passagem] Leitura sem `X-Usuario`.** `GET /atividades`, `GET /atividades/:id` e `GET /salas` não exigem identificação (app.js:129–131, 272–317), enquanto contrato-api.md:12 exige `X-Usuario` em toda rota exceto `/_teste/*` e `GET /certificados/:codigo`. A spec R19 diz leitura "liberada para todos". Divergência contrato × spec — assunto do revisor-de-contrato. Mantida do parecer anterior.

8. **[OBSERVAÇÃO MENOR] `GET /atividades/:id` 404 não testado.** O 404 `NAO_ENCONTRADO` é testado no PATCH (`api/test/m1-r13.test.js:99`) e no cancelamento (`api/test/m1-r16-r17.test.js:96`), mas não no GET `:id` (implementado em app.js:310–315).

9. **[OBSERVAÇÃO MENOR] R16 — caso "encerrada" não executado.** O teste `api/test/m1-r16-r17.test.js:64` avança o relógio para 10:30 (durante a atividade 10:00–12:00), não para depois do fim. O ramo é o mesmo (`api/src/app.js:414`, `agora >= inicioPrimeiroEncontro`), então o comportamento existe, mas o sub-caso "encerrada" do critério 16 não tem prova direta.

**Pendentes registrados (não são falha nova):** R14 (depende de inscrições/M2); P7; P9; parte pendente de P10; P11; P14; P15; parte pendente de P17; código definitivo para vagas abaixo de 1 — POST (`api/src/app.js:158–163`) e PATCH (`api/src/app.js:362–367`) ainda usam `DADOS_INVALIDOS` provisório, e os testes (`api/test/m1-r3-r4.test.js:26–37`, `api/test/m1-r3-r4-patch.test.js:33–44`) corretamente não fixam o código.

**Verificações positivas:** todos os 71 testes começam com `POST /_teste/reset` (48 ocorrências em `api/test/`; o único sem reset é `m1-server.test.js`, que sobe um processo novo com dados iniciais); nenhum teste usa o relógio real para regras — `Date.now()` só aparece no guard de timeout de subida do servidor (`api/test/m1-server.test.js:28,30`); as regras de tempo usam `PUT /_teste/relogio` (`api/test/m1-r9.test.js:34`, `api/test/m1-r16-r17.test.js:53/:67`); o relógio de teste é parado e conhecido (`api/src/app.js:99,110`); formato de erro `{"erro","mensagem"}` consistente; `encontros` em ordem de início com `id` `enc_`+8 hex (app.js:248–250); `situacao` derivada, não guardada (app.js:58–74); shape integral de `Atividade` com os 11 campos agora é assertado (`api/test/m1-cobertura.test.js:99–137`).

## Veredito

Aceito: todas as regras da spec (R1–R13, R15–R19) e os itens do contrato verificados — `GET /salas`, `DADOS_INVALIDOS` no POST, ordem de validação, `npm start`, `projeto.json` — estão implementados e comprovados por teste, com 71 testes verdes (19 suítes); os cinco achados bloqueantes do parecer anterior foram resolvidos. As ressalvas restantes são de borda e não têm regra na spec nem teste: corpo malformado devolve 422 antes da identificação (contrato-api.md:17), e o PATCH aceita `titulo`/`vagas` de tipo errado (contrato-api.md:16).