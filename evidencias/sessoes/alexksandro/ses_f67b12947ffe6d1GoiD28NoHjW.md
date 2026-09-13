# Responder pendências em M1-grade.md

| | |
|---|---|
| Sessão | `ses_f67b12947ffe6d1GoiD28NoHjW` |
| Pasta | aulasIAGustavoQ/semana-academica |
| Período | 12/09 22:08 → 12/09 22:31 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 35 |
| Tokens de entrada / saída | 18.440 / 9.026 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 20 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `12/09 22:08` **prompt** — Vamos responder as perguntas marcadas como PENDENTE em entrevistas/M1-grade.md, uma de cada vez. Eu respondo com o que li no documento de requisitos, citando a regra; registre a minha resposta e ponha a regra na coluna Fonte. Não crie perguntas novas e não mexa nas perguntas já respondidas.
- `12/09 22:11` **prompt** — Palestra deve ter exatamente 1 encontro (RN-102), e minicurso deve ter no mínimo 2 e no máximo 5 encontros (RN-103).
- `12/09 22:11` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:12` **prompt** — As vagas devem ser no mínimo 1 e no máximo a capacidade da sala; 0 não é aceito como quantidade de vagas. (RN-107)
- `12/09 22:13` edita entrevista `entrevistas/M1-grade.md` (4×)
- `12/09 22:18` **prompt** — Um encontro é inválido se durar menos de 1 hora ou mais de 4 horas (RN-104), se não começar e terminar no mesmo dia ou estiver fora do período do evento, de 19 a 23/10/2026 (RN-105), ou se houver sobreposição entre encontros da mesma atividade (RN-106).
- `12/09 22:18` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:21` **prompt** — Há CONFLITO_DE_SALA quando dois encontros usam a mesma sala sem respeitar pelo menos 15 minutos entre o fim de um e o início do outro; portanto, horários encostados também conflitam. Encontros de atividades canceladas não contam para esse conflito (RN-108).Depois de criada, a atividade não permite alterar sala nem encontros, apenas título e vagas (RN-110).
- `12/09 22:22` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:23` **prompt** — A situação é prevista antes do início do primeiro encontro, passa para em_andamento no instante em que o primeiro encontro começa e passa para encerrada no instante do fim do último encontro. Não há tolerância adicional para virar encerrada. Se a atividade estiver cancelada, a situação cancelada prevalece sobre as demais. (RN-114)
- `12/09 22:23` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:24` **prompt** — A listagem deve ser ordenada pelo início do primeiro encontro e, em caso de empate, pelo título; atividades canceladas continuam aparecendo. (RN-115). O filtro dia traz atividades que tenham pelo menos um encontro naquele dia de Brasília, então uma atividade com encontros em dias diferentes pode aparecer em mais de um dia. O filtro dia pode ser combinado com o filtro tipo. (RN-116)
- `12/09 22:24` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:26` **prompt** — O documento de requisitos não define que ocupadas, vagasRestantes e emEspera devam ser 0 constantes no M1. Essa questão não está respondida explicitamente pelas regras do M1 e precisa ser esclarecida.
- `12/09 22:26` edita entrevista `entrevistas/M1-grade.md`
- `12/09 22:28` **prompt** — A cargaHorariaMinutos é calculada pela soma das durações de todos os encontros da atividade, em minutos. A organização não informa esse valor; se ele for enviado, deve ser ignorado. (RN-109)
- `12/09 22:29` edita entrevista `entrevistas/M1-grade.md` (2×)
- `12/09 22:30` **prompt** — O documento de requisitos não define uma ordem de precedência para os erros no POST /atividades. A ordem sugerida não pode ser assumida como regra sem esclarecimento. Essa questão permanece pendente.
- `12/09 22:30` edita entrevista `entrevistas/M1-grade.md`
- `12/09 22:31` **prompt** — Registre a rodada 2 como concluída, mantendo P7 e P9 como pendentes, pois o documento de requisitos não fornece resposta para essas questões. Não atribua regras RN a elas.
- `12/09 22:31` edita entrevista `entrevistas/M1-grade.md` (2×)
