# Entrevista M3 — Presença por QR

- Módulo: M3 — Presença por QR
- Dono: Samuel Souza
- Início: 2026-09-19
- Contrato: `contrato-api.md`, seção M3 + códigos da seção 6
- Método: rodada 1 = perguntas do agente, respostas do usuário; resposta **"consultar requisitos"** marca a pergunta como **pendente**; rodada 2 = consulta ao documento de requisitos para resolver os pendentes.
- Regra: toda resposta `❓` nasce de uma pergunta desta entrevista. Toda regra da spec precisa de origem (pergunta + resposta) e prova (teste).

---

## Pendentes

*(Nenhum pendente registrado — todas as perguntas da Rodada 1 foram respondidas com regras do documento)*

---

## Rodada 1 — Decisões Registradas

### **P1 — Janela do Encontro (`FORA_DA_JANELA`)**
- **Resposta / Regra:** RN-301 — A janela de registro de presença por QR vai de **15 min antes a 30 min depois do início** do encontro, bordas incluídas. Fora desse período retorna `422 FORA_DA_JANELA`.
- **Atende:** NE-04 | **Contrato:** `FORA_DA_JANELA`

### **P2 — Ciclo de troca e emissão de código (`trocaEm`, `validoAte`, `FORA_DA_JANELA`, `ATIVIDADE_CANCELADA`)**
- **Resposta / Regra:**
  - RN-302: Fora da janela de registro de presença, a organização nem obtém o código (retorna `422 FORA_DA_JANELA`); em atividade cancelada, também não (retorna `422 ATIVIDADE_CANCELADA`).
  - RN-303: O código **muda a cada minuto**, em janelas alinhadas ao relógio (de `hh:mm:00` a `hh:mm:59`). `trocaEm` indica o início do próximo minuto e `validoAte` o término do minuto atual.
- **Atende:** NE-04 | **Contrato:** `trocaEm`, `validoAte`, `FORA_DA_JANELA`, `ATIVIDADE_CANCELADA`

### **P3 — Formato e tratamento do código de 6 caracteres**
- **Resposta / Regra:** O código tem 6 caracteres extraídos do alfabeto base `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (exclui `0`, `O`, `1`, `I` para evitar ambiguidade na digitação). Na leitura/submissão, aceita letras minúsculas e ignora espaços em branco.
- **Atende:** NE-04 | **Contrato:** `codigo`

### **P4 — Elegibilidade para presença (`NAO_INSCRITO`)**
- **Resposta / Regra:** RN-306 — Só registra presença quem tem inscrição com status **confirmada** na atividade. Participantes não inscritos ou com outro status (em_espera, convocada, cancelada, expirada) recebem `403 NAO_INSCRITO`.
- **Atende:** NE-04 | **Contrato:** `NAO_INSCRITO`

### **P5 — Presença Offline (`lidoEm`, `origem: "qr_offline"` e `SINCRONIZACAO_TARDIA`)**
- **Resposta / Regra:**
  - Se `lidoEm` for posterior ao envio (ex.: relógio do celular do participante adiantado), vale o instante do envio (relógio do servidor).
  - RN-310: Envio com `lidoEm` é aceito **até 2 h depois do fim** do encontro. Após esse prazo, retorna `422 SINCRONIZACAO_TARDIA`. Se aceito com `lidoEm`, a presença assume `origem: "qr_offline"`.
- **Atende:** NE-05 | **Contrato:** `lidoEm`, `SINCRONIZACAO_TARDIA`, `origem`

### **P6 — Presença Manual (`JUSTIFICATIVA_OBRIGATORIA`, `FORA_DA_JANELA`)**
- **Resposta / Regra:**
  - RN-311: Presença manual (ex: celular sem bateria) só pode ser registrada pela organização, para participante com inscrição confirmada, com justificativa obrigatória de **pelo menos 10 caracteres** (se ausente, nula ou com menos de 10 chars, retorna `422 JUSTIFICATIVA_OBRIGATORIA`).
  - RN-312: Presença manual vale da abertura da janela (15 min antes do início) **até 2 h depois do fim** do encontro. Fora disso, retorna `422 FORA_DA_JANELA`.
- **Atende:** NE-04 | **Contrato:** `JUSTIFICATIVA_OBRIGATORIA`, `FORA_DA_JANELA`

### **P7 — Idempotência e Re-registro de Presença**
- **Resposta / Regra:** Se o participante já possui presença gravada para o encontro, a API responde `200` com a `Presenca` já existente, sem alterar os dados nem criar duplicata.

### **P8 — Atividade Cancelada e Encontro Inexistente**
- **Resposta / Regra:** Retorna `404 NAO_ENCONTRADO` se o encontro não existir. Se o encontro existir mas a atividade associada estiver cancelada, retorna `422 ATIVIDADE_CANCELADA`.

### **P9 — Precedência de Erros no POST de Presença**
- **Resposta / Regra:** Ordem de verificação:
  `NAO_ENCONTRADO` (404) → `ATIVIDADE_CANCELADA` (422) → `FORA_DA_JANELA` (422) → `NAO_INSCRITO` (403) → `SINCRONIZACAO_TARDIA` (422) → `CODIGO_INVALIDO` (422).
