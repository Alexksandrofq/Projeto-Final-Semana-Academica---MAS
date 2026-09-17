# Spec M2 - Inscrições e lista de espera

Esta especificação define as regras de negócio para o módulo de inscrições, derivadas das entrevistas da rodada 1 e 2.

## Mapeamento de Regras de Negócio (RN)

| Item da Entrevista | Regras de Negócio | Descrição Sintética |
| :--- | :--- | :--- |
| 1 (P1) | RN-202 | Encerramento de inscrições 30 minutos antes do 1º encontro. |
| 2 (P2, P3, P11, P12) | RN-205, RN-216, RN-211, RN-213 | Vagas diretas/lista de espera, recomputo de posição, convocação (2h) e restrição de confirmação. |
| 3 (P3) | RN-204 | Posição na fila de espera definida por ordem de entrada. |
| 4 (P4) | RN-206 | Duplicidade restrita a inscrições ativas (`confirmada`, `convocada`, `em_espera`). |
| 5 (P5) | RN-207 | Conflito de horário considera inscrições `confirmada` e `convocada`. |
| 6 (P6) | RN-208 | Limite de até 3 minicursos por participante. |
| 7 (P7) | RN-218, RN-219, RN-210, RN-209 | Precedência de recusa no POST de inscrição. |
| 8 (P8, P11, P12, P13) | RN-211, RN-212, RN-213, RN-215 | Cancelamento pelo dono, prazos de convocação e recusas de confirmação. |
| 9 (P9, P14) | RN-206, RN-207, RN-215 | Status ativos/inativos e precedência na confirmação. |
| 10 (P10, P17) | RN-217 | Cancelamento restrito até o início da atividade e cancelamento em cascata. |

## Detalhamento das Regras

### RN-202: Janela de Inscrição
- As inscrições encerram 30 minutos antes do início do 1º encontro da atividade. Tentativas a partir deste instante retornam `INSCRICOES_ENCERRADAS`.

### RN-205/216: Capacidade e Lista de Espera
- Com vagas, a inscrição nasce `confirmada`. Quando lotada, nasce `em_espera`.

### RN-204: Posição na Espera
- Definida por ordem de entrada. Posições devem ser recomputadas quando houver cancelamento ou expiração anterior.

### RN-206: Duplicidade
- Apenas inscrições ativas (`confirmada`, `convocada`, `em_espera`) bloqueiam com `JA_INSCRITO`.

### RN-207: Conflito de Horário
- Considera apenas inscrições `confirmada` e `convocada`.

### RN-208: Limite de Minicursos
- Limite de 3 minicursos por participante. Status que ocupam vaga (`confirmada`/`convocada`) contam para o limite.

### RN-218/219/210/209: Precedência de Erros no POST
1. `ATIVIDADE_CANCELADA`
2. `INSCRICOES_ENCERRADAS`
3. `INSCRICAO_BLOQUEADA`
4. `JA_INSCRITO`
5. `CONFLITO_DE_HORARIO`
6. `LIMITE_DE_MINICURSOS`

### RN-211: Cancelamento
- Apenas o dono participante pode cancelar. Se outro tentar, 404 `NAO_ENCONTRADO`.
- Apenas status ativos (`confirmada`, `em_espera`, `convocada`) podem ser cancelados. Cancelar status inativo (`cancelada`, `expirada`) retorna `INSCRICAO_INATIVA`.
- Cancelamento permitido apenas até a atividade começar. Se iniciada, retorna `ATIVIDADE_JA_INICIADA`.

### RN-212/213: Efeito de Cancelamento e Convocação
- Ao liberar vaga, a primeira pessoa em_espera é convocada com prazo de 2 horas (`convocadaAte`).

### RN-215: Confirmação
- Válida apenas para status `convocada`. Outros status retornam `SEM_CONVOCACAO`.
- Tentativa após `convocadaAte` retorna `CONVOCACAO_EXPIRADA`.
- Precedência na confirmação: `SEM_CONVOCACAO` -> `CONVOCACAO_EXPIRADA` -> `CONFLITO_DE_HORARIO` -> `LIMITE_DE_MINICURSOS`.

### RN-217: Cancelamento de Atividade
- Ao cancelar uma atividade, todas as inscrições ativas (`confirmada`, `em_espera`, `convocada`) mudam para `cancelada`. Inscrições inativas permanecem inalteradas.

## Pendentes (Não implementar)
- P18: Regras de fuso horário além do contrato base.
- `INSCRICAO_BLOQUEADA` (P7, contrato §6 "só em grupos com M5"): sem M5 neste repositório não há como dispará-la; a precedência implementável/testável do POST é `ATIVIDADE_CANCELADA` → `INSCRICOES_ENCERRADAS` → `JA_INSCRITO` → `CONFLITO_DE_HORARIO` → `LIMITE_DE_MINICURSOS`.
- P15 (ordenação de `GET /inscricoes`): sem regra definitiva — sem ordenação garantida.
- P16 (filtro `atividadeId` inexistente): sem regra definitiva — o filtro `?atividadeId=` existe no contrato, mas o comportamento para ID inexistente (`[]` vs `NAO_ENCONTRADO`) não tem origem definitiva.
