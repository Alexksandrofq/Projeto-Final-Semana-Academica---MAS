# Planejamento do módulo M2 e regras do contrato-api.md

| | |
|---|---|
| Sessão | `ses_f58b10d4cffebreYXeoz6C18LL` |
| Pasta | Documents/SDD |
| Período | 15/09 20:02 → 16/09 22:12 |
| Modelo | openai/gpt-5.5-fast, google/gemini-3.8-flash |
| Requisições ao modelo | 21 |
| Tokens de entrada / saída | 165.060 / 13.535 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 4 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `15/09 20:02` **prompt** — Use a skill grilling. Vamos decidir o módulo M2 antes de qualquer código. Leia o contrato-api.md. Eu não tenho as regras de cabeça, se eu responder "consultar registros" registre a pergunta como pendente. Salve tudo em entrevistas/M2-inscricoes.mc
- `15/09 20:29` **prompt** — 1. O limite é o equivalente à capacidade da sala; 2. Isso, o limite não foi estabelecido; 3. Ordem de entrada, devem ser recomputadas; 4. Sim, caso cancelado ou expirado o usuário deve poder se increver novamente; 5. Apenas confirmada e convocada ; 6. No máximo 3, sem contar palestras.
- `15/09 20:29` edita entrevista `Projeto-Final-Semana-Academica---MAS/entrevistas/M2-inscricoes.mc`
- `15/09 20:32` **prompt** — 1. 30 minutos antes do início do 1º encontro da atividade; 2. 404, Atividade Cancelada, Inscrições encerradas, inscrição bloqueada, já inscrito, conflito de horário e limite de minicursos; 3. sim, somente o dono. Define como ativas inscrições confirmadas, em espera e convocadas. Sim, retorna inativa; 4. Até a atividade começar.
- `15/09 20:32` edita entrevista `Projeto-Final-Semana-Academica---MAS/entrevistas/M2-inscricoes.mc`
- `15/09 20:39` **prompt** — 1. 2 horas a partir do instante que a vaga é liberada; 2. Sim, qualquer status que não seja convocada; 3. Sim, confirmar depois de convocadaAte retorna ConvocacaoExpirada; 4. sem convocacao, convocacao expirada, conflito de horario, limite de minicursos; 5. Sim, inscrição de outro participante retorna 404; 6. Não está coberto pelas regras; 7. Sim, todas as inscrições ativas da atividade, confirma…
- `15/09 20:40` edita entrevista `Projeto-Final-Semana-Academica---MAS/entrevistas/M2-inscricoes.mc`
- `15/09 21:04` **prompt** — atualize a tabela de regras de negócio para mapear as regras; 1: RN-202; 2: RN-205,216,211,213; 3: RN-204; 4: RN-206; 5: RB-207; 6: RN-208; 7: RN-218-219-210-209; 8: RN-211,212,213,215; 9: RN-206,207-215-220; 10: RN-217
- `15/09 21:05` edita entrevista `Projeto-Final-Semana-Academica---MAS/entrevistas/M2-inscricoes.mc`
