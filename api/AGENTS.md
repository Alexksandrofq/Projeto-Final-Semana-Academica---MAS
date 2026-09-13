# AGENTS.md — api/

Guia de quem trabalha na implementação da API da Semana Acadêmica.

## Stack e comandos

- Stack de verdade no `projeto.json` (hoje: Node + Express + SQLite). Os comandos que o juiz roda são os de `api.pasta` em `projeto.json` (`instalar`, `iniciar`); os testes, a lista `testes`.
- Servidor: `src/server.js` sobe via `criarServidor()` de `src/app.js` na porta `PORT` (padrão 3000).
- Testes: Jest (`npm test`), usando `supertest` contra `criarServidor()`.

## Fonte da verdade

- **Contrato** (`../contrato-api.md`, seção do módulo + código da seção 6): o que a API responde — rota, campo, fuso e código não se negociam.
- **Spec do módulo** (`../specs/M1-grade.md`, etc.): o *quando* — prazo, limite, ordem — regra por regra, com origem (P-xx) e critério de aceite.
- A spec é gerada da entrevista (`../entrevistas/`). O documento de requisitos do cliente **não está no repositório** e não deve ser lido, colado nem solicitado pelo agente.

## TDD em fatias

Siga a skill `tdd` (`.opencode/skills/tdd/SKILL.md`): uma fatia da spec por vez, **um teste que falha → o mínimo de código para ele passar → suíte inteira verde → próxima fatia**.

- Teste testa comportamento pela **interface pública**: sobe `criarServidor()` e fala por HTTP (supertest). Não importe serviço/repositório no teste — acopla o teste à implementação.
- Cada teste prova **uma regra** da spec. Convenção atual: um arquivo `test/m1-rX.test.js` por regra R-X do módulo.
- O valor esperado vem da spec, escrito à mão no teste — não calculado do mesmo jeito que o código calcula.
- Nome do teste diz a regra em português. Ex.: `it('recusa palestra com 2 encontros com 422 QUANTIDADE_DE_ENCONTROS')`.
- Teste que passa antes de existir código não testa nada; teste alterado para passar sem a spec ter mudado é trapaça — o suspeito é o código.

## Modo de teste

Todo arquivo de teste começa com `process.env.MODO_TESTE = '1'`. Com o modo de teste:

- `POST /_teste/reset` recarrega os dados iniciais e põe o relógio em `2026-10-13T09:00:00-03:00`. Comece os testes por ele.
- `PUT /_teste/relogio` e `GET /_teste/relogio` controlam o relógio, que fica parado. Toda regra de tempo usa esse relógio — nunca `new Date()` direto.

## Regras de implementação

- **Ordem das verificações** (contrato): identificação (401) → perfil (403) → existência (404) → corpo (422 `DADOS_INVALIDOS`) → regras do recurso. Erro sempre `{ "erro": "CODIGO", "mensagem": "texto livre" }`.
- **Precedência interna entre regras do recurso**: se a spec não a fixa (M1: P9 no POST, P15 no PATCH), **não assuma nem teste uma ordem**.
- **Pendentes não se implementam.** Regra que a spec marca como sem regra (a parte pendente de P7/P9/P10/P11/P14/P15/P17 no M1) não vira validação nem teste. Se a fatia depender disso, pergunte ao dono do módulo em vez de chutar.
- **Não inventar requisitos.** Recomendação de agente ou "o padrão seria..." não entra no código.
- **Rótulos, siglas e mensagens**: use os nomes do contrato e da spec; não crie vocabulário paralelo.
- Terminou uma fatia ou a spec inteira? Rode a suíte completa e relate o número real de testes passando.