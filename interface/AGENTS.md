# AGENTS.md — interface/

Guia de quem trabalha na interface da Semana Acadêmica. É **HTML/CSS/JavaScript puro**, sem framework, sem build: `index.html`, `css/style.css` e `js/app.js`.

## Fonte da verdade

- **Contrato** (`../contrato-api.md`, seção do módulo): os endpoints que a interface chama; a forma do que cada um devolve e os erros possíveis. Rota, nome de campo e código de retorno não se negociam — a interface só consome o que o contrato oferece.
- **Spec do módulo** (`../specs/M1-grade.md`, etc.): o comportamento de negócio (ex.: situação da atividade, campos editáveis), para a tela refletir o estado real.
- A interface **não implementa regra de negócio**: a fonte de verdade é a API. Validação local, no máximo, para UX; nunca para decidir o que é permitido.

## Como chamar a API

- Toda chamada usa `fetch`. A interface consome o endereço da API usado na execução local.
- Toda rota identificada exige o cabeçalho `X-Usuario: <id>` (menos as rotas públicas explícitas no contrato). Sem ele a API responde 401.
- Datas: o contrato troca ISO 8601 com fuso; a tela formata para o usuário, mas **envia e recebe o que o contrato define**.
- Depois de uma operação de escrita (criar, alterar, cancelar), refaça a leitura pela API (`GET`/`GET :id`) — não confie em estado local "espelhado".
- Filtros e parâmetros usam exatamente os nomes do contrato (`?dia=AAAA-MM-DD`, `?tipo=palestra|minicurso`, etc.).

## Exibição dos erros da API

- A API responde erro como `{ "erro": "CODIGO", "mensagem": "texto livre" }`. A interface deve **mostrar `mensagem` ao usuário** e, quando útil, tratar o `erro` (ex.: `SOMENTE_ORGANIZACAO` → avisar que a operação exige organização; `DADOS_INVALIDOS`/`ENCONTRO_INVALIDO` → apontar o formulário; `CONFLITO_DE_SALA` → informar que a sala está ocupada; `ATIVIDADE_JA_INICIADA`/`ATIVIDADE_CANCELADA` → estado da atividade).
- **Nunca engolir erro em silêncio.** Chamada que falhou aparece para o usuário, com a mensagem que a API mandou.
- Não traduzir nem resumir o código de erro no código da tela a ponto de esconder o que a API reportou: a tela mostra o retorno real.

## Regras da tela

- **Não decidir pendências por conta própria.** O que a tela mostra e permite vem do contrato e da spec: implemente apenas o que já está definido neles; não decida comportamento que a spec marca como pendente.
- **Situação e dados calculados vêm do servidor** (`situacao`, `cargaHorariaMinutos`, `ocupadas`, etc.). A interface não os calcula.
- **Perfis** (participante vs organização): o que aparece vem do contrato ("Quem"). A API ancora a decisão com 403 — a tela trata o retorno.
- Proibido duplicar regra de negócio: se duplicar, a tela pode mostrar um estado que a API recusa.
- Mantenha HTML/CSS/JS puro: sem biblioteca de UI nem build para rodar.
- Página em português, `lang="pt-BR"`, semântica e acessibilidade básicas (botões com texto, campos com rótulo).