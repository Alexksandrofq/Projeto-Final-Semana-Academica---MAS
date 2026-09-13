---
name: teste-interface-fake-api
description: Orienta testes automatizados de interfaces web que consomem API HTTP, substituindo a API real por um fake/mock (sem subir o servidor). Use quando pedirem para testar a tela, "teste da interface", "testar o front", "fake da API", "mock do fetch".
---

# Testar a tela contra uma API fake

Teste de interface verifica **o que o usuário vê e faz**, não como o código é escrito.
A API real não sobe em momento nenhum: quem responde é um **fake/mock** do `fetch`. Se um
teste precisar do servidor real ou de um serviço interno, ele acoplou a tela à
implementação — páre e volte para o comportamento.

## O que o teste cobre

- **Comportamento visível**: listar, filtrar, abrir detalhes, submeter formulário, exibir
  mensagem de sucesso/erro, trocar usuário. Um teste = um comportamento.
- **A chamada pela rede**: URL (com query string), método, corpo e **cabeçalhos
  relevantes** (ex.: `X-Usuario`). Isso garante que a tela fala com o contrato.
- **Sucesso e erro**: o mesmo fluxo passa e falha — sucesso renderiza o dado; erro mostra
  a `mensagem` que a API retornou (ex.: `{ "erro": "...", "mensagem": "..." }`).
- **Não duplica regra de negócio**: a tela nunca decide o que é permitido; a API decide.
  O teste não valida regra da API no front e o código da tela também não.

## Como substituir a API

1. **Injete o `fetch`**: a tela deve aceitar `fetch`, o `document` e o endereço da API
   como dependências (ex.: uma fábrica `criarPainel({ document, fetch, enderecoApi })`).
   Sem isso, refatore levemente **antes** de escrever os testes — comportamento idêntico
   para quem usa a tela manualmente.
2. **Fake de `fetch`**: uma função que registra `{ url, method, opcoes }` e devolve
   `{ ok, status, json() }`. Roteie por `(url, method)`; corrija o `status` para 2xx e o
   corpo para a forma do contrato.
3. **Nunca suba a API real** nem instale biblioteca de mock (MSW, nock, jest-fetch-mock).
   Um fake de poucas linhas é suficiente e não acopla a testar framework.

## Verificações por chamada

Antes de declarar a chamada correta, confira na ordem:

1. **URL** exata, com a query string (`/atividades?dia=AAAA-MM-DD&tipo=palestra`).
2. **Método** (`GET`, `POST`, `PATCH`/`DELETE` conforme o contrato).
3. **Cabeçalhos** que o contrato exige (ex.: `X-Usuario`).
4. **Corpo** do pedido (escreva o JSON esperado à mão; confira datas e formato).
5. **Resposta**: sucesso renderiza o que o contrato devolve; erro mostra `mensagem`.

## O ciclo, por comportamento

Um comportamento de cada vez, teste primeiro:

1. Escreva **um** teste que prova **um** comportamento visível. O nome em português:
   `it('mostra a mensagem da API quando a criação falha')`.
2. Rode. **Ele tem que falhar** — vermelho. Teste que passa sem o código existir não
   testa nada.
3. Escreva o mínimo de código que faz ele passar. Nada de implementar o comportamento
   seguinte "que eu vou usar depois".
4. Rode a suíte inteira. Verde? Se o passo seguinte é de outra tela ou de outra fatia,
   volte à spec; se é regressão da mesma tela, próximo comportamento.

**Quando o teste falha, o suspeito é o código.** Mudar o teste para ele passar (valor,
método, cabeçalho, cenário) trocou o contrato pela implementação. Só se altera um teste
se o contrato/spec mudou — e aí se diz qual regra mudou e por quê.

## Três testes que não valem nada

- **Acoplado à implementação** — chamou a função interna em vez de agir pela tela, ou o
  fake devolveu o estado em vez do comportamento. Quebra em refatoração, não em regressão.
- **Tautológico** — montou o esperado com o mesmo `fetch` que a tela usa, ou comparou com
  a própria query do código. Escreva URL, método e corpo à mão.
- **Frouxo** — conferiu só o `status`/presença e ignorou corpo, cabeçalho ou mensagem.
  Um 200 com o campo errado passa.

## Regras que não se quebram

- Teste fala com a tela pela **interface pública**: DOM e eventos (clique, `change`,
  `submit`), com um DOM real (jsdom) e o HTML carregado.
- Valor esperado vem do **contrato**, escrito na mão — não calculado do jeito que a tela
  calcula.
- Não duplicar regra de negócio da API no front: a tela só formata e exibe; decisões
  ficam na API.
- Depois de escrita (criar/alterar/cancelar), a tela refaz a leitura via API — o teste
  pode conferir esse `GET` seguinte, mas não espelhar estado local.
- Terminou? Rode a suíte inteira e relate o número real que apareceu na saída — sem
  estimativa, sem repetir número de outra rodada.