# Sessões — Samuel Souza

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 19/09 12:04 | [New session - 2026-09-19T15:04:11.674Z](ses_f45cdbb65ffeqarKBSi89J68Xx.md) | 151 | grilling, to-spec, tdd | — | 37 / 8 | 3 | 1 | 0 | — |
| 19/09 15:05 | [Telas de M3-presença.md em interface](ses_f45274e56ffeWoITdKwGci72nQ.md) | 37 | — | — | 2 / 2 | 0 | 0 | 1 | — |
| | **Total: 2 sessões** | 188 | grilling, to-spec, tdd | — | 39 / 10 | 3 | 1 | 1 | — |
