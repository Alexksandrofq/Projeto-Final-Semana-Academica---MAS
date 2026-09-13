# Sessões — Alexksandro

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 12/09 21:50 | [Definir M1 grade de atividades Semana Acadêmica](ses_f67c189b6ffeGPzTBmq8K3ITQV.md) | 11 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 12/09 22:08 | [Responder pendências em M1-grade.md](ses_f67b12947ffe6d1GoiD28NoHjW.md) | 35 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 12/09 22:34 | [Entrevista M1: PATCH, cancelamento, autorização](ses_f6798f7c5ffeYbAz5oQ0dfN016.md) | 7 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 12/09 22:42 | [Responder P10-P19 pendentes em M1-grade](ses_f67923f13ffep1pGdLmb6pQgDo.md) | 37 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 12/09 23:01 | [New session - 2026-09-13T02:01:09.818Z](ses_f6780c645ffeQjjs8Xju6jNMk5.md) | 72 | to-spec | — | 1 / 2 | 1 | 0 | 0 | — |
| 12/09 23:31 | [TDD API M1: R1 palestra com 1 encontro](ses_f6765210fffe88DpE1kQWd8U5J.md) | 146 | tdd | auditor (3) | 20 / 29 | 19 | 3 | 1 | — |
| 13/09 01:48 | [Iniciar interface M1 e registrar stack](ses_f66e7a518ffe15YjSpsTo8Rsb2.md) | 5 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 13/09 03:30 | [Criar subagente revisor-de-contrato](ses_f668a8d2affeVdOdV28sh43H2g.md) | 7 | novo-subagente | — | 0 / 0 | 0 | 0 | 0 | — |
| 13/09 03:32 | [Revisão do módulo M1 contra contrato-api](ses_f66880b7affeCjeayYxA4DVPLy.md) | 39 | tdd | revisor-de-contrato (2) | 2 / 2 | 1 | 1 | 0 | — |
| 13/09 05:08 | [Corrigir ordem de validação no PATCH atividades](ses_f6630ec0affelusLhQLxmMkA9z.md) | 133 | tdd, customize-opencode, teste-interface-fake-api | revisor-de-contrato | 4 / 12 | 3 | 2 | 2 | — |
| | **Total: 10 sessões** | 492 | grilling (2), to-spec, tdd (3), novo-subagente, customize-opencode, teste-interface-fake-api | auditor (3), revisor-de-contrato (3) | 27 / 45 | 24 | 6 | 3 | — |
