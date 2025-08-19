# Fluxo Lógico: Protocolo de Dor Torácica

Este documento descreve o fluxo de negócio e as regras para o "Protocolo de Dor Torácica".

1.  **Abertura do Protocolo:**
    *   **Momento da Abertura:** O profissional seleciona onde o protocolo está sendo iniciado (Emergência, Unidade de Internação, Terapia Intensiva, Alta Hospitalar).
    *   **Identificação:** Coleta de dados básicos do paciente: Data de Nascimento, Sexo, Peso e Altura. O número de Atendimento é usado como identificador.

2.  **Hora Zero:** Registra-se o horário exato da admissão do paciente.

3.  **Fatores de Risco:** O profissional seleciona os fatores de risco aplicáveis (Diabetes, Hipertensão, Sedentarismo, História Familiar + DAC Precoce, Obesidade IMC > 30, Tabagismo Ativo, Dislipidemia) a partir de uma lista de checkboxes. Uma opção "Nega fatores de risco" está disponível e, se selecionada, bloqueia as demais.

4.  **Comorbidades:** De forma similar, o profissional seleciona as comorbidades do paciente (AIT, AVC, Câncer Ativo, IAM Prévio, ICP Prévia, IRC, RVM Prévia, Fibrilação Atrial, ICC, NYHA 1/2/3/4, Doença Arterial Periférica, Alergia a Aspirina). A opção "Nega comorbidades" também é exclusiva.

5.  **Avaliação da Dor:**
    *   Pergunta-se se há dor torácica na admissão (Sim/Não).
    *   Registra-se a hora de início da dor de maior intensidade.
    *   Classifica-se o tipo da dor: A (Definitivamente anginosa), B (Provavelmente anginosa), C (Provavelmente não anginosa) ou D (Definitivamente não anginosa).
    *   **Lógica Condicional:** Se a dor for classificada como "D", o protocolo é encerrado e o sistema orienta para uma investigação específica. Caso contrário, o fluxo continua.

6.  **ECG e Avaliação Médica:** Registra-se o horário em que o ECG foi realizado e avaliado pelo médico.

7.  **Decisão de Rota (ECG):** Com base na avaliação do ECG, o sistema apresenta as seguintes opções para o profissional: "IAM com SUPRA ST", "BRE Novo" ou "Outro".
    *   **Lógica Condicional:** Se a opção for "IAM com SUPRA ST", o sistema solicita a seleção da parede acometida (Inferior, VD, Anterior, Posterior, Lateral) e então direciona o paciente para a **ROTA 1**.
    *   **Lógica Condicional:** Se a opção for "BRE Novo", o paciente é direcionado diretamente para a **ROTA 1**.
    *   **Lógica Condicional:** Se a opção for "Outro" (Não diagnóstico, Inversão de onda T, Infra de ST, Supra de ST não isquêmico), o fluxo segue para a coleta de troponina.

---

## ROTA 1: Reperfusão

8.  **Administração de AAS:** O profissional registra a administração de AAS 200mg (mastigar e engolir), com as opções "Não indicado", "Uso Prévio" ou "Outro motivo".

9.  **Segundo Antiagregante Plaquetário:** O profissional seleciona qual antiagregante foi administrado (Prasugrel 60mg, Ticagrelor 180mg, Clopidogrel 600mg, Tirofiban).
    *   **Lógica Condicional:** Se um antiagregante for selecionado, o sistema pergunta o "Momento da Administração": "Antes do conhecimento da Anatomia" ou "Depois do conhecimento da Anatomia".

10. **Disponibilidade de Hemodinâmica:** Pergunta-se "Hemodinâmica Disponível?" (Sim/Não).
    *   **Se Sim (ICP Primária):**
        *   Registram-se os horários de: Contato com hemodinâmica, Chegada do hemodinamicista, Chegada do paciente na sala e Saída do paciente da sala.
        *   Registra-se o horário da "ICP primária" (meta porta-guia de 90 min).
        *   O sistema exibe as instruções: "Não administrar Heparina. Segundo antiplaquetário na sala de emergência ou hemodinâmica (Prasugrel 60mg ou Ticagrelor 180mg). Clopidogrel 600mg (sala de emergência) caso os outros sejam contraindicados."
    *   **Se Não (Trombólise):**
        *   Pergunta-se "Porta Agulha factível em até 120 min?" (Sim/Não).
        *   **Se Sim:** O fluxo segue para o registro de tempos de transferência, similar ao fluxo de ICP Primária.
        *   **Se Não:** Inicia-se o fluxo de Trombólise.
            *   Registra-se o horário de "Início da trombólise" (meta porta-agulha de 30 min).
            *   Seleciona-se o trombolítico: "TNK (>= 75 anos: 50% da dose)" ou "tPA".
            *   O sistema exibe as instruções de dosagem para Clopidogrel e Enoxaparina, com lógicas específicas para pacientes com mais ou menos de 75 anos.

---

## ROTAS 2 e 3: Pacientes sem Supra de ST

Este fluxo é iniciado quando a avaliação do ECG no passo 7 resulta em "Outro".

11. **Coleta de Troponina:** O sistema abre uma seção para o registro de até 3 amostras de troponina. Cada amostra requer: Data, Hora, Valor, Valor de Referência e Unidade de Medida.
    *   *Nota de Implementação:* Esta etapa é assíncrona. O estado do protocolo deve ser salvo após cada entrada, permitindo que o fluxo seja pausado e retomado por outro profissional quando os resultados dos exames estiverem disponíveis.

12. **Administração de AAS:** O profissional registra a administração de AAS 200mg (mastigar e engolir), com as opções "Não indicado", "Uso Prévio" ou "Outro motivo".

13. **Definição de SCASST:** O sistema pergunta "SCA sem supra de ST definida?" (Sim/Não), com base em critérios clínicos, eletrocardiográficos e/ou laboratoriais. A resposta a esta pergunta determina a rota a seguir.
    *   **Se Sim:** O fluxo segue para a **ROTA 2**.
    *   **Se Não:** O fluxo segue para a **ROTA 3**.

### ROTA 2: SCASST Definida

14. **Avaliação de Risco (GRACE Score):** O sistema apresenta uma calculadora para o **GRACE Score**. O profissional insere os dados necessários e o sistema calcula o escore automaticamente.

15. **Estratificação de Risco e Conduta:** Com base no resultado da Troponina e do GRACE Score, o sistema apresenta a conduta proposta correspondente.
    *   **Baixo Risco (Tropo normal, ECG Normal, Grace < 109):** A conduta proposta é "Avaliar indicação de dupla-antiagregação e anticoagulação. Estratificação não invasiva."
    *   **Risco Intermediário (Tropo normal, ECG normal, DAV prévia ou Grace > 109 e < 140):** A conduta proposta é "Ticagrelor 180mg ou Clopidogrel 300mg (na indisponibilidade do Ticagrelor). Enoxaparina plena. Definir estratificação invasiva (até 48h) x não invasiva ao longo da internação."
    *   **Risco Alto (Tropo > normal, ECG alterado ou Grace > 140):** A conduta proposta é "Discutir com a cardiologia - Avaliar CAT precoce (<12h). Se CAT precoce: Ticagrelor 180mg ou Prasugrel 60mg na sala da hemodinâmica. Na indisponibilidade: Clopidogrel 300mg na sala de emergência. Se CAT > 12h: Ticagrelor 180mg ou Clopidogrel 300mg (se Ticagrelor contraindicado) + Enoxaparina plena."
    *   **Risco Muito Alto (Paciente instável):** A conduta proposta é "Discutir com a cardiologia - Avaliar CAT ultra precoce (<2h). Ticagrelor 180mg ou Prasugrel 60mg na sala da hemodinâmica. Na indisponibilidade: Clopidogrel 300mg na sala de emergência."

### ROTA 3: SCASST Não Definida

16. **Avaliação de Risco (Scores):** O sistema apresenta as calculadoras para o **GRACE Score** e o **HEART Score**.

17. **Conduta Proposta:**
    *   **Lógica Condicional:** Se o **HEART Score for >= 2**, a conduta proposta é "Internar para estratificação".

---

## Dados da Internação e Desfecho

Esta seção é preenchida ao longo da internação para consolidar o caso do paciente.

18. **Ecocardiograma na Internação:**
    *   Opções: "Não realizado", ou preenchimento dos seguintes campos:
    *   **Fração de Ejeção:** Valor numérico, com seleção do método ("Simpson" ou "Teicholz").
    *   **Nova alteração segmentar:** "Sim", "Não" ou "Desconhecida".

19. **Estratificação Não Invasiva:**
    *   Opção "Não realizado" (com campo de justificativa se o paciente veio da ROTA 2).
    *   O profissional seleciona **um** dos exames abaixo, que abre suas respectivas opções:
        *   **Eco de Stress:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **Cintilografia Miocárdica:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **Teste de Esforço:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **RNM de Stress:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **Tomografia de Coronárias:** "Sem DAC", "DAC Obstrutiva (>50%)", "DAC não obstrutiva (<50%)", "Anomalia de coronária: Sim/Não", "Dissecção Coronária: Sim/Não", "Score de Cálcio: (valor numérico)", "Não realizada".

20. **Procedimento Invasivo:**
    *   Opção "Não realizado" (com campo de justificativa se o paciente for de alto risco).
    *   **Cateterismo Cardíaco:** "Não realizado" ou "Sim" (com opções: "Sem DAC", "DAC obstrutiva", "DAC não obstrutiva").
    *   **Angioplastia Coronariana:** "Não realizado" ou "Sim" (com opções: "1 artéria", "2 artérias", "3 ou mais artérias", "TCE: Sim/Não").
    *   **Cirurgia de Revascularização Miocárdica:** "Não realizado" ou "Sim" (com opções: "1 enxerto", "2 enxertos", "3 ou mais enxertos", "TCE: Sim/Não").
    *   **Avaliação Funcional e Imagem Intra-coronária:** "Não realizado" ou "Sim" (com opções: "FFR", "IVUS", "OCT").

21. **Outros Procedimentos e Suportes:**
    *   **Implante de Marcapasso:** "Sim" ou "Não".
    *   **BIA (Balão Intra-Aórtico):** "Sim" ou "Não".
    *   **Suporte Ventricular Mecânico:** "Sim" ou "Não".

22. **Complicações:** Uma lista de checkboxes para selecionar as complicações ocorridas.
    *   Opções: "Nenhuma", "AIT/AVCi", "Fibrilação Atrial", "TV/FV", "Bloqueio AV com MP", "PCR Revertida", "Tamponamento", "CIV", "IM aguda", "Ruptura livre de parede do VE", "Choque Cardiogênico", "Pericardite pós IAM", "Reinfarto (Pós angioplastia, Pós cirurgia de Revasc, Espontâneo)", "Trombose intra-stent", "Insuficiência Respiratória com VM", "IRA com diálise", "Sangramento (Sem transfusão, Com transfusão, Intracraniano, Fatal)".

23. **Diagnóstico Final:**
    *   O profissional seleciona o diagnóstico principal: "IAM sem supra ST", "IAM com supra ST", "Dor torácica não cardíaca", "Angina Instável", "Angina estável", "Sd. Aórtica Aguda", "Miocardite", "Pericardite", "Takotsubo", "TEP".
    *   **Lógica Condicional:** Se o diagnóstico for "IAM sem supra ST" ou "IAM com supra ST", o sistema solicita a seleção da **Etiologia do IAM**:
        *   Opções: "DAC Obstrutiva", "DAC não obstrutiva", "Dissecção coronária", "Êmbolo / Trombo", "Trombose de Stent", "Anomalia de coronária", "Vasoespasmo".

---
        *   **Cintilografia Miocárdica:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **Teste de Esforço:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **RNM de Stress:** "Isquêmico", "Não isquêmico", "Não realizado".
        *   **Tomografia de Coronárias:** "Sem DAC", "DAC Obstrutiva (>50%)", "DAC não obstrutiva (<50%)", "Anomalia de coronária: Sim/Não", "Dissecção Coronária: Sim/Não", "Score de Cálcio: (valor numérico)", "Não realizada".

20. **Procedimento Invasivo:**
    *   Opção "Não realizado" (com campo de justificativa se o paciente for de alto risco).
    *   **Cateterismo Cardíaco:** "Não realizado" ou "Sim" (com opções: "Sem DAC", "DAC obstrutiva", "DAC não obstrutiva").
    *   **Angioplastia Coronariana:** "Não realizado" ou "Sim" (com opções: "1 artéria", "2 artérias", "3 ou mais artérias", "TCE: Sim/Não").
    *   **Cirurgia de Revascularização Miocárdica:** "Não realizado" ou "Sim" (com opções: "1 enxerto", "2 enxertos", "3 ou mais enxertos", "TCE: Sim/Não").
    *   **Avaliação Funcional e Imagem Intra-coronária:** "Não realizado" ou "Sim" (com opções: "FFR", "IVUS", "OCT").

21. **Outros Procedimentos e Suportes:**
    *   **Implante de Marcapasso:** "Sim" ou "Não".
    *   **BIA (Balão Intra-Aórtico):** "Sim" ou "Não".
    *   **Suporte Ventricular Mecânico:** "Sim" ou "Não".

22. **Complicações:** Uma lista de checkboxes para selecionar as complicações ocorridas.
    *   Opções: "Nenhuma", "AIT/AVCi", "Fibrilação Atrial", "TV/FV", "Bloqueio AV com MP", "PCR Revertida", "Tamponamento", "CIV", "IM aguda", "Ruptura livre de parede do VE", "Choque Cardiogênico", "Pericardite pós IAM", "Reinfarto (Pós angioplastia, Pós cirurgia de Revasc, Espontâneo)", "Trombose intra-stent", "Insuficiência Respiratória com VM", "IRA com diálise", "Sangramento (Sem transfusão, Com transfusão, Intracraniano, Fatal)".

23. **Diagnóstico Final:**
    *   O profissional seleciona o diagnóstico principal: "IAM sem supra ST", "IAM com supra ST", "Dor torácica não cardíaca", "Angina Instável", "Angina estável", "Sd. Aórtica Aguda", "Miocardite", "Pericardite", "Takotsubo", "TEP".
    *   **Lógica Condicional:** Se o diagnóstico for "IAM sem supra ST" ou "IAM com supra ST", o sistema solicita a seleção da **Etiologia do IAM**:
        *   Opções: "DAC Obstrutiva", "DAC não obstrutiva", "Dissecção coronária", "Êmbolo / Trombo", "Trombose de Stent", "Anomalia de coronária", "Vasoespasmo".

---
