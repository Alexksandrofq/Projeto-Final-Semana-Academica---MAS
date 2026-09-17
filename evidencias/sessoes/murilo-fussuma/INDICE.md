# Sessões — Murilo Fussuma

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 15/09 20:02 | [Planejamento do módulo M2 e regras do contrato-api.md](ses_f58b10d4cffebreYXeoz6C18LL.md) | 21 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 22:20 | [Respostas pendentes em entrevistas/M2-incricoes.md](ses_f5832ac5dffeMXB7eVv6Q5nSPQ.md) | 11 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 22:34 | [Especificação de specs/M2-inscricoes.md](ses_f5825b313ffeJv13xuvZy84sax.md) | 10 | customize-opencode | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 22:37 | [TDD da fatia 1 em specs/M2-inscricoes.md](ses_f58236771ffeM86v1vOS4ehyZj.md) | 36 | — | — | 9 / 2 | 0 | 1 | 1 | — |
| 15/09 22:48 | [Auditoria do módulo M2 contra specs](ses_f58191a4affeNPehk6d2lpJkmZ.md) | 7 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 22:52 | [TDD para specs/M2-inscricoes.md](ses_f58160a41ffeQYiGQEu0ERfPUw.md) | 143 | — | — | 17 / 24 | 3 | 8 | 3 | — |
| 16/09 21:23 | [Auditoria M2 contra M2-inscricoes.md](ses_f5340d886ffeRe5GcrgN3M03L1.md) | 19 | — | — | 0 / 3 | 0 | 0 | 0 | — |
| 16/09 21:25 | [Correção pontos mencionados pelo auditor](ses_f533e8897ffeamAKWbsSJIFkJr.md) | 41 | — | — | 1 / 3 | 0 | 0 | 1 | — |
| 16/09 21:30 | [Auditoria M2 contra spec inscricoes](ses_f533aa5c6ffeholwCpsr5jxqyY.md) | 13 | — | — | 0 / 2 | 0 | 0 | 0 | — |
| 16/09 21:32 | [Resolver achados RN-215/RN-222 com TDD](ses_f5338414fffe2W10NdAFNGUZzz.md) | 50 | tdd | — | 0 / 8 | 0 | 3 | 1 | — |
| 16/09 21:39 | [Auditoria M2 contra M2-inscricoes.md](ses_f53324241ffeuPtDmTj6FSOtKE.md) | 28 | — | — | 0 / 5 | 0 | 0 | 0 | — |
| 16/09 21:54 | [Telas M2 inscrições Semana Acadêmica](ses_f5324a4ecffe0FaH8rk4BkU7Cv.md) | 56 | — | — | 1 / 7 | 0 | 1 | 0 | — |
| | **Total: 12 sessões** | 435 | customize-opencode, tdd | — | 28 / 54 | 3 | 13 | 6 | — |
