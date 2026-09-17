# TDD da fatia 1 em specs/M2-inscricoes.md

| | |
|---|---|
| Sessão | `ses_f58236771ffeM86v1vOS4ehyZj` |
| Pasta | Documents/SDD |
| Período | 15/09 22:37 → 16/09 22:12 |
| Modelo | google/gemini-3.1-flash-lite |
| Requisições ao modelo | 36 |
| Tokens de entrada / saída | 245.349 / 6.419 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 9 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 1 vez(es) teste e código juntos |
| Arquivos editados | 5 de teste, 6 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `15/09 22:37` **prompt** — use a skill tdd. Implemente só a fatia 1 de specs/M2-inscricoes.md. Os testes devem ser realizados um por vês. Escreva o teste, mostre sua falha, por fim o código.
- `15/09 22:37` edita teste `Projeto-Final-Semana-Academica---MAS/api/test/m2-r202.test.js`
- `15/09 22:37` roda `npm test api/test/m2-r202.test.js` → **vermelho** — _teste novo falhando, como deve ser_
- `15/09 22:37` roda `npm test test/m2-r202.test.js` → **vermelho**
- `15/09 22:38` roda `npx jest test/m2-r202.test.js` → **vermelho**
- `15/09 22:39` roda `npm test test/m2-r202.test.js` → **vermelho**
- `15/09 22:39` edita código `Projeto-Final-Semana-Academica---MAS/api/src/app.js`
- `15/09 22:39` roda `npx jest test/m2-r202.test.js` → **vermelho**
- `15/09 22:39` edita código `Projeto-Final-Semana-Academica---MAS/api/src/app.js`
- `15/09 22:39` roda `npx jest test/m2-r202.test.js` → **vermelho**
- `15/09 22:39` edita código `Projeto-Final-Semana-Academica---MAS/api/src/app.js`
- `15/09 22:39` roda `npx jest test/m2-r202.test.js` → **vermelho**
- `15/09 22:39` edita teste `Projeto-Final-Semana-Academica---MAS/api/test/m2-r202.test.js`
- `15/09 22:39` roda `npx jest test/m2-r202.test.js` → **vermelho** — _teste novo falhando, como deve ser_
- `15/09 22:39` edita teste `Projeto-Final-Semana-Academica---MAS/api/test/m2-r202.test.js`
- `15/09 22:40` roda `npx jest test/m2-r202.test.js` → **vermelho** — _teste novo falhando, como deve ser_
- `15/09 22:40` edita teste `Projeto-Final-Semana-Academica---MAS/api/test/m2-r202.test.js`
- `15/09 22:40` roda `npx jest test/m2-r202.test.js` → verde (1 passaram) — _teste novo já nasceu verde_
- `15/09 22:40` edita código `Projeto-Final-Semana-Academica---MAS/api/src/app.js` (3×)
- `15/09 22:41` edita teste `Projeto-Final-Semana-Academica---MAS/api/test/m2-r202.test.js`
- `15/09 22:41` roda `npx jest test/m2-r202.test.js` → verde (1 passaram) — _teste e código mudaram juntos: não houve vermelho para ver_
