# Responder P10-P19 pendentes em M1-grade

| | |
|---|---|
| Sessão | `ses_f67923f13ffep1pGdLmb6pQgDo` |
| Pasta | aulasIAGustavoQ/semana-academica |
| Período | 12/09 22:42 → 12/09 22:55 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 37 |
| Tokens de entrada / saída | 31.774 / 10.053 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 22 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `12/09 22:42` **prompt** — Vamos responder as perguntas P10 a P19 marcadas como PENDENTE em entrevistas/M1-grade.md, uma de cada vez. Eu respondo com o que li no documento de requisitos, citando a regra; registre a minha resposta e ponha a regra na coluna Fonte. Não crie perguntas novas e não mexa nas perguntas já respondidas. Se o documento não responder uma pergunta, mantenha-a como pendente.
- `12/09 22:45` **prompt** — Depois de criada, a atividade só permite alteração de título e vagas. Sala, tipo e encontros não podem ser alterados. (RN-110) O documento não especifica se, ao enviar campos editáveis e não editáveis juntos, o PATCH inteiro deve ser recusado sem aplicar nenhuma alteração.
- `12/09 22:45` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:47` **prompt** — O documento não define explicitamente se título e vagas podem continuar sendo alterados quando a atividade está em andamento ou encerrada. A RN-110 define apenas quais campos são editáveis, sem estabelecer restrição temporal para o PATCH. Portanto, essa questão permanece pendente.
- `12/09 22:47` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:48` **prompt** — Para impedir a redução de vagas, contam as inscrições confirmadas e convocadas,pois são as que ocupam vaga. Inscrições em espera não entram nessa contagem. (RN-111)
- `12/09 22:48` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:49` **prompt** — Uma atividade cancelada não pode ser alterada novamente; portanto, não é permitido fazer PATCH em uma atividade cancelada. (RN-113)
- `12/09 22:49` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:51` **prompt** — O documento não define o comportamento de PATCH com corpo vazio, nem estabelece regras para título vazio, em branco ou limites de tamanho. A RN-110 apenas determina que título e vagas são os campos editáveis.Portanto, P14 permanece pendente.
- `12/09 22:51` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:52` **prompt** — O documento não define uma ordem de precedência para os erros no PATCH Portanto, P15 permanece pendente.
- `12/09 22:52` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:53` **prompt** — O cancelamento só é permitido antes de a atividade começar. A partir do instante de início do primeiro encontro, inclusive, o cancelamento deve ser negado com ATIVIDADE_JA_INICIADA;isso também vale para uma atividade já encerrada. (RN-112)
- `12/09 22:53` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:53` **prompt** — Uma atividade já cancelada não pode ser cancelada novamente, devendo resultar em ATIVIDADE_CANCELADA. (RN-113) O documento não especifica se um corpo enviado na requisição de cancelamento deve ser ignorado ou recusado; essa parte permanece pendente.
- `12/09 22:53` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:54` **prompt** — O cancelamento da atividade também cancela todas as inscrições ativas vinculadas a ela. Esse efeito está definido no módulo M2. (RN-217)
- `12/09 22:54` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:55` **prompt** — Somente a organização pode criar, alterar e cancelar atividades. (RN-101) O documento não define dono ou criador individual da atividade, nem estabelece regras adicionais de autorização entre usuários da organização.
- `12/09 22:55` edita entrevista `entrevistas/M1-grade.md` (4×)
