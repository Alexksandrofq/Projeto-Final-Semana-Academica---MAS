# Spec — M3 Presença por QR

Origem: `entrevistas/M3-presença.md` (Rodada 1 concluída). Contrato: seção M3 e códigos da seção 6 de `contrato-api.md`.

## 1. Objetivo

Permitir o controle de frequência nos encontros das atividades da Semana Acadêmica através de códigos QR dinâmicos exibidos pela organização. Os participantes podem registrar presença escaneando o código de forma online ou offline (sincronizando posteriormente). Para casos excepcionais (ex.: participante sem bateria), a organização pode registrar a presença manualmente com justificativa.

## 2. Fora de escopo

- **Criação e edição de encontros/atividades** (pertence ao M1).
- **Gestão de inscrições e lista de espera** (pertence ao M2).
- **Emissão e validação de certificados** com base no percentual de presenças (pertence ao M4).
- **Relatório consolidado de frequência e bloqueio por faltas** (pertence ao M5).

## 3. Modelo

### CodigoDoEncontro (resposta do GET `/encontros/:id/codigo`)

| Campo | Tipo | Descrição / Origem |
|---|---|---|
| `encontroId` | string `enc_` + 8 hex | Identificador do encontro |
| `codigo` | string (6 chars) | Código gerado para o minuto atual (R3, R4) |
| `trocaEm` | string ISO 8601 | Instante em que o próximo código entra em vigor (início do próximo minuto) |
| `validoAte` | string ISO 8601 | Instante em que o código atual deixa de ser aceito (término do minuto atual) |

### Presenca (resposta do registro e listagem de presenças)

| Campo | Tipo | Descrição / Origem |
|---|---|---|
| `id` | string `pre_` + 8 hex | Gerado no registro da presença |
| `encontroId` | string `enc_` + 8 hex | Identificador do encontro |
| `participanteId` | string | Identificador do participante |
| `origem` | `"qr"` \| `"qr_offline"` \| `"manual"` | Determinado conforme o fluxo de registro (R6, R7) |
| `lidoEm` | string ISO 8601 | Instante da leitura (ou do registro/envio se online/manual) |
| `registradaEm` | string ISO 8601 | Instante em que o registro deu entrada no servidor |
| `justificativa` | string \| null | Texto da justificativa (obrigatório e ≥ 10 chars para `manual`; null para `qr` e `qr_offline`) |

## 4. Endpoints

Rotas, perfis e códigos de sucesso conforme contrato (seção M3 de `contrato-api.md`).

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| GET | `/encontros/:id/codigo` | organização | 200 `CodigoDoEncontro` |
| POST | `/encontros/:id/presencas` | participante | 201 `Presenca` (primeira vez) / 200 `Presenca` (já registrada) |
| POST | `/encontros/:id/presencas/manual` | organização | 201 `Presenca` (primeira vez) / 200 `Presenca` (já registrada) |
| GET | `/encontros/:id/presencas` | organização | 200 `[Presenca]` |

## 5. Regras

### Emissão do Código QR (`GET /encontros/:id/codigo`)

- **R1** (P1, P2, RN-301, RN-302): A obtenção do código QR só é permitida dentro da janela de presença do encontro, definida como de **15 minutos antes a 30 minutos depois do horário de início** do encontro (bordas incluídas). Fora dessa janela → `FORA_DA_JANELA` (422).
- **R2** (P2, RN-302): Se a atividade associada ao encontro estiver cancelada (`situacao: cancelada`) → `ATIVIDADE_CANCELADA` (422).
- **R3** (P2, RN-303): O código **muda a cada minuto**, em janelas alinhadas ao relógio do sistema/teste (`hh:mm:00` a `hh:mm:59`). `trocaEm` é o instante do próximo minuto e `validoAte` é o primeiro instante em que o código expira (`hh:mm:00` do minuto seguinte).
- **R4** (P3): O código de 6 caracteres é composto exclusivamente por caracteres da base `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excluindo `0`, `O`, `1`, `I` para evitar confusão).

### Registro de Presença por QR (`POST /encontros/:id/presencas`)

- **R5** (P4, RN-306): Apenas participantes com inscrição no status **`confirmada`** na atividade correspondente podem registrar presença. Participante não inscrito ou com inscrição em qualquer outro status (`em_espera`, `convocada`, `cancelada`, `expirada`) → `NAO_INSCRITO` (403).
- **R6** (P3): Na leitura do código submetido no corpo (`codigo`), a API deve ignorar espaços em branco e aceitar letras minúsculas, convertendo-as para maiúsculas antes de validar. Se o código fornecido não corresponder ao código válido no momento da leitura → `CODIGO_INVALIDO` (422).
- **R7** (P1, RN-301): Para registros de presença online (sem envio de `lidoEm`), a requisição deve ser feita dentro da janela de presença (15 min antes a 30 min depois do início do encontro). Fora do período → `FORA_DA_JANELA` (422). O campo `origem` será `"qr"` e `lidoEm` assume o instante atual do servidor (`registradaEm`).
- **R8** (P5, RN-310): Para registros de presença offline (com envio de `lidoEm` no corpo):
  - Se `lidoEm` for um instante futuro em relação ao relógio do servidor (ex.: relógio do celular adiantado), `lidoEm` é ajustado para o instante atual do envio.
  - O código enviado deve ser o código válido no instante `lidoEm`, e `lidoEm` deve estar dentro da janela de presença (R1).
  - A requisição de sincronização é aceita **até no máximo 2 horas depois do término** (`fim`) do encontro. Se a requisição chegar após esse prazo → `SINCRONIZACAO_TARDIA` (422).
  - Quando aceito com `lidoEm`, a presença recebe `origem: "qr_offline"`.

### Presença Manual (`POST /encontros/:id/presencas/manual`)

- **R9** (P6, RN-311): Apenas a organização pode registrar presença manual. Exige o envio da `justificativa`, que deve conter no mínimo 10 caracteres preenchidos (se ausente, nula ou com menos de 10 caracteres válidos) → `JUSTIFICATIVA_OBRIGATORIA` (422). O participante informado no corpo (`participanteId`) deve possuir inscrição `confirmada` na atividade (caso contrário → `NAO_INSCRITO`, 403).
- **R10** (P6, RN-312): A presença manual pode ser lançada a partir da abertura da janela de presença (15 minutos antes do início do encontro) até no máximo **2 horas depois do término** do encontro. Fora desse intervalo → `FORA_DA_JANELA` (422). A presença criada terá `origem: "manual"`.

### Idempotência, Validações de Recursos e Precedência

- **R11** (P7): Se o participante já possuir presença registrada para o mesmo encontro (por qualquer origem), uma nova tentativa de registro bem-sucedida não cria duplicata e responde HTTP `200` com a `Presenca` gravada anteriormente.
- **R12** (P8): Requisições direcionadas a um `encontroId` que não existe na base de dados respondem `NAO_ENCONTRADO` (404).
- **R13** (P8): Em todas as rotas de registro/código do encontro, se a atividade associada estiver cancelada → `ATIVIDADE_CANCELADA` (422).
- **R14** (P9): A ordem de precedência de verificação de erros no `POST /encontros/:id/presencas` é:
  1. Autenticação do usuário (`401 USUARIO_DESCONHECIDO`)
  2. Perfil de acesso (`403 SOMENTE_PARTICIPANTE`)
  3. Existência do encontro (`404 NAO_ENCONTRADO`)
  4. Corpo JSON / campos obrigatórios (`422 DADOS_INVALIDOS`)
  5. Situação da atividade cancelada (`422 ATIVIDADE_CANCELADA`)
  6. Janela do encontro para envio online (`422 FORA_DA_JANELA`)
  7. Status da inscrição do participante (`403 NAO_INSCRITO`)
  8. Prazo máximo de sincronização offline (`422 SINCRONIZACAO_TARDIA`)
  9. Validade do código no instante lido (`422 CODIGO_INVALIDO`)

- **R15** (P2, P6): As rotas `GET /encontros/:id/codigo`, `POST /encontros/:id/presencas/manual` e `GET /encontros/:id/presencas` exigem perfil `organizacao` (`SOMENTE_ORGANIZACAO`, 403 para participante). A rota `POST /encontros/:id/presencas` exige perfil `participante` (`SOMENTE_PARTICIPANTE`, 403 para organização).

## 6. Critérios de aceite

1. **(R1, R3, R4, R15)** `GET /encontros/:id/codigo` por organização 10 min antes do início do encontro → `200 OK` com `codigo` de 6 chars da base permitida, `trocaEm` no início do minuto seguinte e `validoAte`.
2. **(R1)** `GET /encontros/:id/codigo` 20 min antes do início do encontro → `422 FORA_DA_JANELA`.
3. **(R2, R13)** `GET /encontros/:id/codigo` para encontro de atividade cancelada → `422 ATIVIDADE_CANCELADA`.
4. **(R5, R6, R7, R15)** `POST /encontros/:id/presencas` por participante com inscrição `confirmada`, com código válido no momento dentro da janela → `201 Created` com `origem: "qr"`, `justificativa: null`.
5. **(R6)** `POST /encontros/:id/presencas` enviando código em minúsculas e com espaços " k7m2qx " → aceito e registrado se corresponder ao código ativo.
6. **(R5)** `POST /encontros/:id/presencas` por participante em lista de espera ou não inscrito → `403 NAO_INSCRITO`.
7. **(R6)** `POST /encontros/:id/presencas` com código incorreto ou expirado → `422 CODIGO_INVALIDO`.
8. **(R8)** `POST /encontros/:id/presencas` enviando `lidoEm` dentro da janela, sincronizado 1h após o fim do encontro → `201 Created` com `origem: "qr_offline"`.
9. **(R8)** `POST /encontros/:id/presencas` enviando `lidoEm` dentro da janela, sincronizado 2h01min após o fim do encontro → `422 SINCRONIZACAO_TARDIA`.
10. **(R9, R10)** `POST /encontros/:id/presencas/manual` pela organização com justificativa "Participante estava sem bateria no celular" (≥10 chars) dentro da janela ampliada → `201 Created` com `origem: "manual"`.
11. **(R9)** `POST /encontros/:id/presencas/manual` com justificativa "Sem bat" (< 10 chars) ou ausente → `422 JUSTIFICATIVA_OBRIGATORIA`.
12. **(R10)** `POST /encontros/:id/presencas/manual` 2h05min após o fim do encontro → `422 FORA_DA_JANELA`.
13. **(R11)** `POST /encontros/:id/presencas` repetido para participante que já tem presença no encontro → `200 OK` retornando a mesma presença previamente criada.
14. **(R12)** Chamada a qualquer rota do M3 com `encontroId` inexistente → `404 NAO_ENCONTRADO`.
15. **(R14)** `POST /encontros/:id/presencas` em atividade cancelada com participante não inscrito → retorna `422 ATIVIDADE_CANCELADA` (respeita precedência R14).
16. **(R15)** `GET /encontros/:id/presencas` por organização → `200 OK` retornando o array de todas as presenças registradas para o encontro.

## 7. Como isto será verificado

Os testes serão executados contra a API HTTP (Express) iniciada em `MODO_TESTE=1`. O tempo do sistema será manipulado via `PUT /_teste/relogio` e os dados zerados via `POST /_teste/reset`. As chamadas utilizarão o cabeçalho `X-Usuario` correspondente aos usuários organizadores e participantes predefinidos.

## 8. Fatias de entrega

### Fatia 1 — Código QR e Presença Online
- Implementar `GET /encontros/:id/codigo` (geração e rotação de código a cada minuto, validação de janela e perfil) (R1, R2, R3, R4, R12, R13, R15).
- Implementar `POST /encontros/:id/presencas` básico para presença online no tempo presente (R5, R6, R7, R11, R14).

### Fatia 2 — Presença Offline e Sincronização Tardia
- Suporte a `lidoEm` em `POST /encontros/:id/presencas`, verificação do código no tempo da leitura, ajuste de relógio adiantado e tratamento de `SINCRONIZACAO_TARDIA` (R8).

### Fatia 3 — Presença Manual e Listagem de Presenças
- Implementar `POST /encontros/:id/presencas/manual` com validação de justificativa e janela de até 2h pós-encontro (R9, R10).
- Implementar `GET /encontros/:id/presencas` para listagem de presenças do encontro (R15).
