## Matriz de rastreabilidade

| Regra | Origem | Teste que comprova | Veredito |
|---|---|---|---|
| R1 | P-01 (RN-102) | api/test/m1-r1.test.js:13 «palestra com 2 encontros → 422»; :34 «0 encontros → 422» | COMPROVADA |
| R2 | P-01 (RN-103) | api/test/m1-r2.test.js:13 «minicurso com 1 encontro → 422»; :33 «6 encontros → 422» | COMPROVADA |
| R3 | P-02 (RN-107) | api/test/m1-r3-r4.test.js:26 «vagas 0 no POST → 422»; api/test/m1-r3-r4-patch.test.js:33 «vagas 0 no PATCH → 422» | COMPROVADA (código do erro pendente, teste não o fixa) |
| R4 | P-02 (RN-107) | api/test/m1-r3-r4.test.js:47 «vagas 41 na sala-101 → 422 VAGAS_ACIMA_DA_CAPACIDADE»; api/test/m1-r3-r4-patch.test.js:46 «idem no PATCH» | COMPROVADA |
| R5 | P-03 (RN-104) | api/test/m1-r5.test.js:23 «38 min → 422 ENCONTRO_INVALIDO»; :35 «5 h → 422» | COMPROVADA |
| R6 | P-03 (RN-105) | api/test/m1-r6.test.js:23 «cruza meia-noite → 422»; :35 «antes de 19/10 → 422»; :47 «depois de 23/10 → 422» | COMPROVADA |
| R7 | P-03 (RN-106) | api/test/m1-r7.test.js:23 «sobreposição parcial → 422»; :40 «encontro contido → 422» | COMPROVADA |
| R8 | P-04 (RN-108) | api/test/m1-r8.test.js:23 «14 min → 409 CONFLITO_DE_SALA»; :41 «15 min → 201»; :59 «salas diferentes → 201»; api/test/m1-r15-r8-r10.test.js:52 «cancelada não gera conflito → 201» | COMPROVADA (cenário "encostado" de 0 min não executado — ver Achado 4) |
| R9 | P-05 (RN-114) | api/test/m1-r9.test.js:39 «antes do início → prevista»; :45 «instante do início → em_andamento»; :51 «durante → em_andamento»; :57 «instante do fim → encerrada»; api/test/m1-r16-r17.test.js:33 «cancelada prevalece» | COMPROVADA |
| R10 | P-06 (RN-115) | api/test/m1-r10-r11.test.js:43 «ordena por início do 1º encontro»; :55 «empate por título»; api/test/m1-r15-r8-r10.test.js:70 «cancelada aparece com situacao cancelada» | COMPROVADA |
| R11 | P-06 (RN-116) | api/test/m1-r10-r11.test.js:75 «filtro tipo»; :94 «filtro dia (Brasília)»; :116 «dia+tipo»; :135 «aparece nos dois dias» | COMPROVADA |
| R12 | P-08 (RN-109) | api/test/m1-r12.test.js:30 «2 encontros de 3 h → 360»; :49 «cargaHorariaMinutos: 999 ignorado → 360» | COMPROVADA |
| R13 | P-10 (RN-110) | api/test/m1-r13.test.js:33 «só titulo → 200 e GET reflete»; :51 «só vagas → 200»; :63 «tipo → 422 CAMPO_NAO_EDITAVEL»; :75 «salaId → 422»; :87 «encontros → 422»; :99 «inexistente → 404» | COMPROVADA |
| R14 | P-12 (RN-111) | — | PENDENTE (depende de inscrições/M2) |
| R15 | P-13 (RN-113) | api/test/m1-r15-r8-r10.test.js:40 «PATCH em cancelada → 422 ATIVIDADE_CANCELADA» | COMPROVADA |
| R16 | P-16 (RN-112) | api/test/m1-r16-r17.test.js:33 «antes do início → 200»; :50 «instante do início → 422 ATIVIDADE_JA_INICIADA»; :64 «depois do início → 422» | COMPROVADA (caso "encerrada" não executado — mesmo ramo de app.js:380) |
| R17 | P-17 (RN-113) | api/test/m1-r16-r17.test.js:78 «segundo cancelamento → 422 ATIVIDADE_CANCELADA» | COMPROVADA |
| R18 | P-18 (RN-217) | api/test/m1-r16-r17.test.js:33 «cancela → 200 situacao cancelada»; :44 «GET reflete cancelada» | COMPROVADA (só o efeito em `situacao` é assertado; "nada além muda" não é verificado) |
| R19 | P-19 (RN-101) | api/test/m1-r19.test.js:21 «org cria → 201»; :52 «p-carla → 403 e nada criado»; :67/:76 «401 sem/desconhecido»; api/test/m1-r13.test.js:128/:139/:149 «403/401 no PATCH»; api/test/m1-r16-r17.test.js:125/:136/:146 «403/401 no cancelamento» | COMPROVADA (cenário "org-bruno opera atividade de org-ana" não executado — ver Achado 5) |
| GET /salas | contrato seção 5 M1; spec §4 | — | SEM PROVA (rota não implementada — ver Achado 1) |
| Ordem 401→403→404→regras | contrato-api.md:17 | api/test/m1-r13.test.js:99/:128/:139; api/test/m1-r16-r17.test.js:96/:125/:136; api/test/m1-r19.test.js:52/:67 | COMPROVADA (etapa "422 DADOS_INVALIDOS corpo" ausente — ver Achado 3) |

## Suíte

`npx jest` (executado em `api/`) →

```
Test Suites: 15 passed, 15 total
Tests:       56 passed, 56 total
Snapshots:   0 total
Time:        3.034 s
Ran all test suites.
```

Observação: `projeto.json` está com `testes: []` (vazio) e `stack`/`instalar`/`iniciar` como "PREENCHER" — o comando de teste não está declarado no projeto; rodei `npx jest` conforme o escopo da auditoria e o script `"test": "jest"` de `api/package.json:7`.

## Achados

1. **[SEM PROVA — rota ausente] `GET /salas` não existe.** O contrato (seção 5 M1) e a spec (§4) exigem `GET /salas` → 200 `[Sala]`. As rotas registradas em `api/src/app.js` são apenas `/_teste/reset`, `/_teste/relogio` (PUT/GET), `POST /atividades`, `GET /atividades`, `GET /atividades/:id`, `PATCH /atividades/:id` e `POST /atividades/:id/cancelamento` (app.js:81–389). Nenhum teste chama `/salas` (grep em `api/test/` não encontra a rota). Cenário que expõe: `GET /salas` com `X-Usuario: org-ana` → 404 do Express, não 200 `[Sala]`.

2. **[DEFEITO DE EXECUÇÃO] `npm start` não sobe a API.** `api/package.json:8` define `"start": "node src/server.js"`, mas `src/server.js` não existe (só `src/app.js`). Executado: `npm start` → `Error: Cannot find module '...\api\src\server.js'`. O juiz do contrato sobe a API via `iniciar` (contrato-api.md:28–35); com o estado atual a API não é iniciável pelo comando documentado. Os testes passam porque usam `criarServidor()` direto via supertest, sem subir servidor.

3. **[SEM PROVA — não implementado] Validação de corpo `422 DADOS_INVALIDOS`.** O contrato (contrato-api.md:16) exige 422 para "campo obrigatório ausente ou de tipo errado". Em `POST /atividades` o corpo é desestruturado sem validação (app.js:122): `encontros` ausente → `TypeError` em app.js:141 (500); `vagas` ausente → `vagas < 1` e `vagas > capacidade` não disparam (app.js:124–137) e a atividade é criada com `vagas: undefined` (app.js:227); `tipo`/`salaId` ausentes também passam. JSON malformado cairia no handler padrão do Express (400), não 422. Nenhum teste cobre corpo ausente/malformado. A única recusa de corpo é o caso provisório `vagas < 1` (app.js:124–129).

4. **[PROVA PARCIAL] R8 — cenário "encostado" (fim = início) do critério 7 não é executado.** A spec (R8 e critério 7) exige que horários encostados (intervalo 0 < 15 min) → 409. Os testes usam intervalo de 14 min (m1-r8.test.js:23–39) e 15 min (m1-r8.test.js:41–57); nenhum usa intervalo 0. O ramo de código é o mesmo (app.js:204), então o comportamento existe, mas o cenário exato do critério não tem prova.

5. **[PROVA PARCIAL] R19 — cenário "sem dono" do critério 19 não é executado.** O critério 19 exige que `org-bruno` altere/cancele atividade criada por `org-ana`. Nenhum teste usa `org-bruno` (grep em `api/test/` não encontra). A implementação não rastreia criador (app.js:107–120, 285–298, 347–360 só checam papel), então o comportamento existe, mas não há teste que o execute.

6. **[OBSERVAÇÃO] PATCH recusado pode aplicar `titulo` antes de recusar.** Em app.js:324–326 o `titulo` é gravado antes da validação de `vagas` (app.js:327–342). Um PATCH `{ titulo: "X", vagas: 0 }` retorna 422 mas deixa o título alterado no estado. Nenhum teste cobre; a spec não tem regra sobre atomicidade nesse caso (P10 pendente trata só a mistura editável/não editável).

7. **[OBSERVAÇÃO] `ocupadas`/`vagasRestantes`/`emEspera` fixos em 0 (app.js:64–66).** O valor é a decisão pendente P7; a spec (§2) diz que a implementação não deve assumir decisões pendentes. Nenhum teste verifica esses campos (grep em `api/test/` não encontra). Registro como PENDENTE, não como defeito implementável.

8. **[CONTRATO — citar de passagem] Leitura sem `X-Usuario`.** `GET /atividades` sem cabeçalho retorna 200 nos testes (m1-r10-r11.test.js:49, m1-r15-r8-r10.test.js:73, m1-r19.test.js:63), enquanto contrato-api.md:12 exige identificação em toda rota exceto `/_teste/*` e `GET /certificados/:codigo`. A spec R19 diz leitura "liberada para todos". Divergência entre contrato e spec — assunto do revisor-de-contrato.

**Pendentes registrados (não são defeito implementável):** R14 (depende de inscrições/M2); P7; P9; parte pendente de P10; P11; P14; P15; parte pendente de P17; código definitivo para vagas abaixo de 1 (R3 no POST e no PATCH usa `DADOS_INVALIDOS` provisoriamente, app.js:124–129 e 328–333).

**Verificações positivas:** todos os 56 testes começam com `POST /_teste/reset` (app.js:81–90 limpa salas, usuários, atividades e relógio); nenhum teste usa o relógio real da máquina (`new Date()`/`Date.now` ausentes — só `PUT /_teste/relogio` em m1-r9.test.js:34 e m1-r16-r17.test.js:53/:67); o relógio de teste é parado e conhecido (app.js:79, 96, 104); formato de erro `{"erro","mensagem"}` consistente em todas as recusas; `encontros` retornados em ordem de início com `id` `enc_`+8 hex (app.js:214–216); `situacao` derivada, não guardada (app.js:36–52).

## Veredito

Não aceito: falta implementar `GET /salas` e o arquivo `src/server.js` (o `npm start` documentado quebra), falta a validação de corpo `422 DADOS_INVALIDOS` (campo ausente/tipo errado), e faltam testes para o cenário encostado de R8, para `org-bruno` operando atividade de `org-ana` (R19) e para o formato completo da resposta `Atividade` (nenhum teste assere o shape integral com os 11 campos).