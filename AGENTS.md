# AGENTS.md — Semana Acadêmica

Leia antes de qualquer trabalho neste repositório. Este arquivo vale para qualquer agente (OpenCode ou humano) que for tocar no projeto.

## O que é o projeto

Aplicação da Semana Acadêmica no estilo cliente–servidor: uma API (stack definida em `projeto.json`, hoje Node + Express) e uma interface em HTML/CSS/JavaScript puro, ambas guiadas por um contrato fixo e por specs por módulo. É um trabalho de disciplina de desenvolvimento com agentes de IA: cada módulo nasce de uma entrevista, vira uma spec, é implementado por fatias com teste primeiro e é auditado depois.

## Organização do repositório

| Caminho | O que é | Regra |
|---|---|---|
| `contrato-api.md` | **O que** a API responde: rotas, campos, códigos de retorno, dados iniciais, modo de teste. | **Não alterar.** Rota, nome de campo e código não se negociam. |
| `projeto.json` | Como o juiz instala, inicia e testa a API. | Preencher com a stack real do grupo; não descrever com texto inventado. |
| `EQUIPE.md` | Dono de cada módulo. | Não editar nomes de outros. |
| `entrevistas/` | Entrevista de cada módulo em duas rodadas. Respostas `❓` nascem de perguntas (P-xx); "consultar requisitos" marca **pendente**. | Um arquivo por módulo; salvar a rodada 2 como nova seção. |
| `specs/` | Spec por módulo, gerada pela skill `to-spec`. Regras numeradas, cada uma com origem (P-xx) e, quando há, RN do documento de requisitos. | Implementar **somente** as regras definitivas. |
| `auditorias/` | Pareceres do subagente `auditor` e do `revisor-de-contrato`. | Salvar inteiros, sem editar. |
| `evidencias/` | Exportação das sessões do OpenCode (linha do tempo). | Cada integrante roda `node evidencias/exportar-evidencias.js` semanalmente. |
| `.opencode/skills/` | Skills do grupo: `grilling`, `to-spec`, `tdd`, `novo-subagente`. | Usar a skill certa para a tarefa certa. |
| `.opencode/agent/` | Subagentes (ex.: `auditor`). | Chamar pelo nome (`@auditor ...`). |
| `api/` | Implementação da API. | Ver `api/AGENTS.md`. |
| `interface/` | Interface em HTML/CSS/JavaScript puro. | Ver `interface/AGENTS.md`. |

## Como o projeto avança, por módulo

1. **Entrevista** (`grilling`): o agente pergunta, o dono do módulo responde. "Consultar requisitos" → pergunta **pendente**, resolvida na rodada 2 consultando o documento de requisitos.
2. **Spec** (`to-spec`): a conversa vira contrato verificável — regras numeradas, cada uma com origem (P-xx + RN quando houver) e critérios de aceite.
3. **Implementação** (`tdd`): fatias verticais, teste primeiro, vermelho → verde → próxima fatia.
4. **Interface**: consome a API pelos endpoints do contrato.
5. **Auditoria** (`@auditor`): cada regra da spec precisa ter nascido de uma pergunta da entrevista e ter um teste que a prove.

## Disciplinas que não se quebram

- **Contrato é o limite.** A interface e o juiz consomem exatamente o que está em `contrato-api.md`. Nada de rota, campo, fuso ou código de retorno além do contrato.
- **Não implementar requisitos pendentes.** Regras que a entrevista deixou pendentes (a spec as lista, ex.: M1 marca P7, P9, P10, P11, P14, P15, P17 como sem regra) **não viram código, teste nem tela**. Sem spec definitiva, não existe "geralmente é assim".
- **Não inventar requisitos funcionais.** Toda regra de negócio vem da entrevista. Recomendação de agente, achismo ou "o padrão seria..." não é regra.
- **O documento de requisitos do cliente fica fora deste repositório.** Agentes não o leem, não o colam na conversa nem pedem ao usuário para anexá-lo — as sessões exportadas e o `git log` rastreiam essas três coisas. A spec é a fonte dos "quando" (prazo, limite, ordem entre regras).
- **Auditoria não conserta.** O `auditor` só lê e aponta o que ficou sem origem ou sem prova. Quem conserta é o agente que implementa.
- **Commits só quando pedidos.** Não commitar por conta própria.

## Antes de escrever código

1. Confira se existe spec do módulo em `specs/` e a entrevista em `entrevistas/`.
2. Leia a seção do módulo em `contrato-api.md`.
3. Se algo estiver pendente e bloquear a fatia, **pergunte ao dono do módulo** — não preencha com suposição.
4. Ajuste a explicitação da stack real no `projeto.json` se ela tiver mudado.