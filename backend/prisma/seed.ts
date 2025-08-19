import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const medicoRole = await prisma.role.upsert({
    where: { name: 'MEDICO' },
    update: {},
    create: { name: 'MEDICO' },
  });

  const relatorioRole = await prisma.role.upsert({
    where: { name: 'RELATORIO' },
    update: {},
    create: { name: 'RELATORIO' },
  });

  console.log({ adminRole, medicoRole, relatorioRole });

  // Create a Hospital
  const hospital = await prisma.hospital.upsert({
    where: { name: 'Hospital Central' },
    update: {},
    create: {
      name: 'Hospital Central',
      city: 'Cidade Exemplo',
    },
  });
  console.log({ hospital });

  // Create an Admin User
  const hashedPassword = await bcrypt.hash('adminpassword', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      hospitalId: hospital.id,
    },
  });
  console.log({ adminUser });

  // Create a Protocol Definition for Dor Toracica
  const dorToracicaProtocol = await prisma.protocolDefinition.create({
    data: {
      title: 'Protocolo de Dor Torácica',
      description: 'Protocolo para avaliação e manejo de pacientes com dor torácica aguda.',
      structureJson: {
        initialStep: 'step_1_identificacao',
        steps: [
          {
            id: 'step_1_identificacao',
            type: 'form',
            label: 'Identificação do Paciente',
            fields: [
              { id: 'numero_atendimento', label: 'Número de Atendimento', type: 'text' },
              { id: 'data_nascimento', label: 'Data de Nascimento', type: 'date' },
              { id: 'sexo', label: 'Sexo', type: 'singleChoice', options: ['Masculino', 'Feminino'] },
              { id: 'peso', label: 'Peso (kg)', type: 'number' },
              { id: 'altura', label: 'Altura (cm)', type: 'number' },
            ],
            navigation: [{ goTo: 'step_2_hora_zero' }],
          },
          {
            id: 'step_2_hora_zero',
            type: 'form',
            label: 'HORA ZERO (Admissão)',
            fields: [
              { id: 'hora_admissao', label: 'Hora da Admissão', type: 'time' },
            ],
            navigation: [{ goTo: 'step_3_fatores_risco' }],
          },
          {
            id: 'step_3_fatores_risco',
            type: 'form',
            label: 'Fatores de Risco',
            fields: [
              {
                id: 'fatores_risco',
                label: 'Fatores de Risco',
                type: 'multipleChoice',
            options: [
              { label: 'Nega fatores de risco', value: 'nega_risco', exclusive: true },
              { label: 'Diabetes', value: 'diabetes' },
              { label: 'Hipertensão', value: 'has' },
              { label: 'Sedentarismo', value: 'sedentarismo' },
              { label: 'História Familiar + DAC Precoce', value: 'hist_familiar_dac' },
              { label: 'Obesidade IMC > 30', value: 'obesidade' },
              { label: 'Tabagismo Ativo', value: 'tabagismo' },
              { label: 'Dislipidemia', value: 'dislipidemia' },
                ],
              },
            ],
            navigation: [{ goTo: 'step_4_comorbidades' }],
          },
          {
            id: 'step_4_comorbidades',
            type: 'form',
            label: 'Comorbidades',
            fields: [
              {
                id: 'comorbidades',
                label: 'Comorbidades',
                type: 'multipleChoice',
            options: [
              { label: 'Nega comorbidades', value: 'nega_comorbidades', exclusive: true },
              { label: 'AIT', value: 'ait' },
              { label: 'AVC', value: 'avc' },
              { label: 'Câncer Ativo', value: 'cancer_ativo' },
              { label: 'IAM Prévio', value: 'iam_previo' },
              { label: 'ICP Prévia', value: 'icp_previa' },
              { label: 'IRC', value: 'irc' },
              { label: 'RVM Prévia', value: 'rvm_previa' },
              { label: 'Fibrilação Atrial', value: 'fa' },
              { label: 'ICC', value: 'icc' },
              { label: 'NYHA 1, 2, 3 ou 4', value: 'nyha' },
              { label: 'Doença Arterial Periférica', value: 'dap' },
              { label: 'Alergia a Aspirina', value: 'alergia_aas' },
                ],
              },
            ],
            navigation: [{ goTo: 'step_5_avaliacao_dor' }],
          },
          {
            id: 'step_5_avaliacao_dor',
            type: 'form',
            label: 'Avaliação da Dor',
            fields: [
              { id: 'dor_admissao', label: 'Dor torácica na Admissão?', type: 'singleChoice', options: ['Sim', 'Não'] },
              { id: 'hora_inicio_dor', label: 'Hora do início da dor de maior intensidade', type: 'time' },
              {
                id: 'tipo_dor',
                label: 'Tipo de dor',
                type: 'singleChoice',
                options: [
                  { label: 'A (Definitivamente anginosa)', value: 'A' },
                  { label: 'B (Provavelmente anginosa)', value: 'B' },
                  { label: 'C (Provavelmente não anginosa)', value: 'C' },
                  { label: 'D (Definitivamente não anginosa)', value: 'D' },
                ],
              },
            ],
            navigation: [
              { onValue: 'D', field: 'tipo_dor', goTo: 'step_end_investigacao_especifica' },
              { goTo: 'step_6_ecg_hora' },
            ],
          },
          {
            id: 'step_6_ecg_hora',
            type: 'form',
            label: 'Hora da Realização do ECG da Admissão e avaliação médica',
            fields: [
              { id: 'hora_ecg', label: 'Hora da Realização do ECG', type: 'time' },
            ],
            navigation: [{ goTo: 'step_7_ecg_avaliacao' }],
          },
          {
            id: 'step_7_ecg_avaliacao',
            type: 'form',
            label: 'Avaliação do ECG',
            fields: [
              {
                id: 'ecg_resultado',
                label: 'Resultado',
                type: 'singleChoice',
                options: ['IAM com SUPRA ST', 'BRE Novo', 'Outro'],
              },
              {
                id: 'supra_parede',
                label: 'Parede (se IAM com SUPRA ST)',
                type: 'singleChoice',
                options: ['Inferior', 'VD', 'Anterior', 'Posterior', 'Lateral'],
                condition: { field: 'ecg_resultado', value: 'IAM com SUPRA ST' },
              },
            ],
            navigation: [
              { onValue: 'IAM com SUPRA ST', field: 'ecg_resultado', goTo: 'step_8_rota1_start' },
              { onValue: 'BRE Novo', field: 'ecg_resultado', goTo: 'step_8_rota1_start' },
              { onValue: 'Outro', field: 'ecg_resultado', goTo: 'step_11_coleta_troponina' },
            ],
          },
          {
            id: 'step_end_investigacao_especifica',
            type: 'info',
            label: 'Dor definitivamente não anginosa. Sair do protocolo e indicar investigação específica.',
            navigation: [{ goTo: 'step_final' }],
          },
          // ROTA 1: Reperfusão
          {
            id: 'step_8_rota1_start',
            type: 'info',
            label: 'ROTA 1: Reperfusão - Paciente com IAM com SUPRA ST ou BRE Novo',
            navigation: [{ goTo: 'step_9_aas' }],
          },
          {
            id: 'step_9_aas',
            type: 'form',
            label: 'Administração de AAS',
            fields: [
              {
                id: 'aas_200mg',
                label: 'AAS 200mg (mastigar e engolir)',
                type: 'singleChoice',
                options: ['Administrado', 'Não indicado', 'Uso Prévio', 'Outro motivo'],
              },
            ],
            navigation: [{ goTo: 'step_10_antiagregante' }],
          },
          {
            id: 'step_10_antiagregante',
            type: 'form',
            label: 'Segundo Antiagregante Plaquetário',
            fields: [
              {
                id: 'antiagregante',
                label: 'Antiagregante administrado',
                type: 'singleChoice',
                options: ['Prasugrel 60mg', 'Ticagrelor 180mg', 'Clopidogrel 600mg', 'Tirofiban'],
              },
              {
                id: 'momento_administracao',
                label: 'Momento da Administração',
                type: 'singleChoice',
                options: ['Antes do conhecimento da Anatomia', 'Depois do conhecimento da Anatomia'],
                condition: { field: 'antiagregante', value: ['Prasugrel 60mg', 'Ticagrelor 180mg', 'Clopidogrel 600mg'] },
              },
            ],
            navigation: [{ goTo: 'step_11_hemodinamica' }],
          },
          {
            id: 'step_11_hemodinamica',
            type: 'form',
            label: 'Disponibilidade de Hemodinâmica',
            fields: [
              {
                id: 'hemodinamica_disponivel',
                label: 'Hemodinâmica Disponível?',
                type: 'singleChoice',
                options: ['Sim', 'Não'],
              },
            ],
            navigation: [
              { onValue: 'Sim', field: 'hemodinamica_disponivel', goTo: 'step_12_icp_primaria' },
              { onValue: 'Não', field: 'hemodinamica_disponivel', goTo: 'step_15_trombólise' },
            ],
          },
          {
            id: 'step_12_icp_primaria',
            type: 'form',
            label: 'ICP Primária - Hemodinâmica Disponível',
            fields: [
              { id: 'contato_hemodinamica', label: 'Horário do Contato com hemodinâmica', type: 'time' },
              { id: 'chegada_hemodinamicista', label: 'Horário da Chegada do hemodinamicista', type: 'time' },
              { id: 'chegada_paciente_sala', label: 'Horário da Chegada do paciente na sala', type: 'time' },
              { id: 'saida_paciente_sala', label: 'Horário da Saída do paciente da sala', type: 'time' },
              { id: 'icp_primaria', label: 'Horário da ICP primária (meta porta-guia de 90 min)', type: 'time' },
            ],
            navigation: [{ goTo: 'step_13_instrucoes_icp' }],
          },
          {
            id: 'step_13_instrucoes_icp',
            type: 'info',
            label: 'INSTRUÇÕES: Não administrar Heparina. Segundo antiplaquetário na sala de emergência ou hemodinâmica (Prasugrel 60mg ou Ticagrelor 180mg). Clopidogrel 600mg (sala de emergência) caso os outros sejam contraindicados.',
            navigation: [{ goTo: 'step_final' }],
          },
          {
            id: 'step_15_trombólise',
            type: 'form',
            label: 'Trombólise - Hemodinâmica Não Disponível',
            fields: [
              {
                id: 'porta_agulha_factivel',
                label: 'Porta Agulha factível em até 120 min?',
                type: 'singleChoice',
                options: ['Sim', 'Não'],
              },
            ],
            navigation: [
              { onValue: 'Sim', field: 'porta_agulha_factivel', goTo: 'step_16_transferencia' },
              { onValue: 'Não', field: 'porta_agulha_factivel', goTo: 'step_17_trombolitico' },
            ],
          },
          {
            id: 'step_16_transferencia',
            type: 'form',
            label: 'Transferência para Hemodinâmica',
            fields: [
              { id: 'contato_hemodinamica_transf', label: 'Horário do Contato com hemodinâmica', type: 'time' },
              { id: 'chegada_hemodinamicista_transf', label: 'Horário da Chegada do hemodinamicista', type: 'time' },
              { id: 'chegada_paciente_sala_transf', label: 'Horário da Chegada do paciente na sala', type: 'time' },
              { id: 'saida_paciente_sala_transf', label: 'Horário da Saída do paciente da sala', type: 'time' },
            ],
            navigation: [{ goTo: 'step_13_instrucoes_icp' }],
          },
          {
            id: 'step_17_trombolitico',
            type: 'form',
            label: 'Trombólise',
            fields: [
              { id: 'inicio_trombólise', label: 'Horário de Início da trombólise (meta porta-agulha de 30 min)', type: 'time' },
              {
                id: 'trombolitico',
                label: 'Trombolítico',
                type: 'singleChoice',
                options: ['TNK (>= 75 anos: 50% da dose)', 'tPA'],
              },
            ],
            navigation: [{ goTo: 'step_18_instrucoes_trombólise' }],
          },
          {
            id: 'step_18_instrucoes_trombólise',
            type: 'info',
            label: 'INSTRUÇÕES: Clopidogrel 300mg na sala de emergência. Enoxaparina: < 75 anos: 30mg EV + 1mg/kg SC 12/12h; >= 75 anos: 0.75mg/kg SC 12/12h (sem dose inicial).',
            navigation: [{ goTo: 'step_final' }],
          },
          // ROTAS 2 e 3: Pacientes sem Supra de ST
          {
            id: 'step_11_coleta_troponina',
            type: 'form',
            label: 'Coleta de Troponina',
            fields: [
              {
                id: 'troponina_1',
                label: 'Amostra 1',
                type: 'group',
                fields: [
                  { id: 'troponina_1_data', label: 'Data', type: 'date' },
                  { id: 'troponina_1_hora', label: 'Hora', type: 'time' },
                  { id: 'troponina_1_valor', label: 'Valor', type: 'number' },
                  { id: 'troponina_1_referencia', label: 'Valor de Referência', type: 'number' },
                  { id: 'troponina_1_unidade', label: 'Unidade', type: 'text' },
                ],
              },
              {
                id: 'troponina_2',
                label: 'Amostra 2 (opcional)',
                type: 'group',
                fields: [
                  { id: 'troponina_2_data', label: 'Data', type: 'date' },
                  { id: 'troponina_2_hora', label: 'Hora', type: 'time' },
                  { id: 'troponina_2_valor', label: 'Valor', type: 'number' },
                  { id: 'troponina_2_referencia', label: 'Valor de Referência', type: 'number' },
                  { id: 'troponina_2_unidade', label: 'Unidade', type: 'text' },
                ],
              },
              {
                id: 'troponina_3',
                label: 'Amostra 3 (opcional)',
                type: 'group',
                fields: [
                  { id: 'troponina_3_data', label: 'Data', type: 'date' },
                  { id: 'troponina_3_hora', label: 'Hora', type: 'time' },
                  { id: 'troponina_3_valor', label: 'Valor', type: 'number' },
                  { id: 'troponina_3_referencia', label: 'Valor de Referência', type: 'number' },
                  { id: 'troponina_3_unidade', label: 'Unidade', type: 'text' },
                ],
              },
            ],
            navigation: [{ goTo: 'step_12_aas_rota2' }],
          },
          {
            id: 'step_12_aas_rota2',
            type: 'form',
            label: 'Administração de AAS (Rota 2/3)',
            fields: [
              {
                id: 'aas_200mg_rota2',
                label: 'AAS 200mg (mastigar e engolir)',
                type: 'singleChoice',
                options: ['Administrado', 'Não indicado', 'Uso Prévio', 'Outro motivo'],
              },
            ],
            navigation: [{ goTo: 'step_13_definicao_scasst' }],
          },
          {
            id: 'step_13_definicao_scasst',
            type: 'form',
            label: 'Definição de SCASST',
            fields: [
              {
                id: 'scasst_definida',
                label: 'SCA sem supra de ST definida?',
                type: 'singleChoice',
                options: ['Sim', 'Não'],
              },
            ],
            navigation: [
              { onValue: 'Sim', field: 'scasst_definida', goTo: 'step_14_rota2_start' },
              { onValue: 'Não', field: 'scasst_definida', goTo: 'step_16_rota3_start' },
            ],
          },
          // ROTA 2: SCASST Definida
          {
            id: 'step_14_rota2_start',
            type: 'info',
            label: 'ROTA 2: SCASST Definida - Avaliação de Risco (GRACE Score)',
            navigation: [{ goTo: 'step_15_grace_score' }],
          },
          {
            id: 'step_15_grace_score',
            type: 'form',
            label: 'GRACE Score',
            fields: [
              { id: 'grace_idade', label: 'Idade', type: 'number' },
              { id: 'grace_freq_cardiaca', label: 'Freqüência Cardíaca', type: 'number' },
              { id: 'grace_pressao_sistolica', label: 'Pressão Sistólica', type: 'number' },
              { id: 'grace_creatinina', label: 'Creatinina (mg/dL)', type: 'number' },
              { id: 'grace_killip', label: 'Classe Killip', type: 'singleChoice', options: ['I', 'II', 'III', 'IV'] },
              { id: 'grace_elevacao_troponina', label: 'Elevação da Troponina', type: 'singleChoice', options: ['Normal', 'Elevada'] },
              { id: 'grace_ecg_alterado', label: 'ECG Alterado', type: 'singleChoice', options: ['Normal', 'Alterado'] },
              { id: 'grace_parada_cardiorespiratoria', label: 'Parada Cardiorrespiratória', type: 'singleChoice', options: ['Não', 'Sim'] },
            ],
            navigation: [{ goTo: 'step_16_estratificacao_risco' }],
          },
          {
            id: 'step_16_estratificacao_risco',
            type: 'form',
            label: 'Estratificação de Risco e Conduta',
            fields: [
              {
                id: 'nivel_risco',
                label: 'Nível de Risco',
                type: 'singleChoice',
                options: [
                  'Baixo Risco (Tropo normal, ECG Normal, Grace < 109)',
                  'Risco Intermediário (Tropo normal, ECG normal, DAV prévia ou Grace > 109 e < 140)',
                  'Risco Alto (Tropo > normal, ECG alterado ou Grace > 140)',
                  'Risco Muito Alto (Paciente instável)',
                ],
              },
            ],
            navigation: [{ goTo: 'step_final' }],
          },
          // ROTA 3: SCASST Não Definida
          {
            id: 'step_16_rota3_start',
            type: 'info',
            label: 'ROTA 3: SCASST Não Definida - Avaliação de Risco (GRACE + HEART Score)',
            navigation: [{ goTo: 'step_17_heart_score' }],
          },
          {
            id: 'step_17_heart_score',
            type: 'form',
            label: 'HEART Score',
            fields: [
              { id: 'heart_historia', label: 'História', type: 'singleChoice', options: ['Altamente suspeita', 'Moderadamente suspeita', 'Pouco suspeita'] },
              { id: 'heart_ecg', label: 'ECG', type: 'singleChoice', options: ['Normal', 'Alterações inespecíficas', 'Alterações isquêmicas'] },
              { id: 'heart_idade', label: 'Idade', type: 'singleChoice', options: ['18-45', '46-64', '≥65'] },
              { id: 'heart_fatores_risco', label: 'Fatores de Risco', type: 'singleChoice', options: ['0', '1-2', '≥3'] },
              { id: 'heart_troponina', label: 'Troponina', type: 'singleChoice', options: ['Normal', '1-3x normal', '>3x normal'] },
            ],
            navigation: [{ goTo: 'step_18_conduta_rota3' }],
          },
          {
            id: 'step_18_conduta_rota3',
            type: 'form',
            label: 'Conduta Proposta (Rota 3)',
            fields: [
              {
                id: 'conduta_rota3',
                label: 'Conduta',
                type: 'singleChoice',
                options: [
                  'Internar para estratificação (HEART Score >= 2)',
                  'Alta com retorno em 24-48h (HEART Score < 2)',
                ],
              },
            ],
            navigation: [{ goTo: 'step_final' }],
          },
          // Dados da Internação e Desfecho
          {
            id: 'step_19_ecocardiograma',
            type: 'form',
            label: 'Ecocardiograma na Internação',
            fields: [
              {
                id: 'eco_realizado',
                label: 'Ecocardiograma realizado?',
                type: 'singleChoice',
                options: ['Sim', 'Não realizado'],
              },
              {
                id: 'fracao_ejecao',
                label: 'Fração de Ejeção (%)',
                type: 'number',
                condition: { field: 'eco_realizado', value: 'Sim' },
              },
              {
                id: 'metodo_fracao_ejecao',
                label: 'Método',
                type: 'singleChoice',
                options: ['Simpson', 'Teicholz'],
                condition: { field: 'eco_realizado', value: 'Sim' },
              },
              {
                id: 'nova_alteracao_segmentar',
                label: 'Nova alteração segmentar',
                type: 'singleChoice',
                options: ['Sim', 'Não', 'Desconhecida'],
                condition: { field: 'eco_realizado', value: 'Sim' },
              },
            ],
            navigation: [{ goTo: 'step_20_estratificacao_nao_invasiva' }],
          },
          {
            id: 'step_20_estratificacao_nao_invasiva',
            type: 'form',
            label: 'Estratificação Não Invasiva',
            fields: [
              {
                id: 'estratificacao_realizada',
                label: 'Estratificação não invasiva realizada?',
                type: 'singleChoice',
                options: ['Sim', 'Não realizado'],
              },
              {
                id: 'tipo_estratificacao',
                label: 'Tipo de Estratificação',
                type: 'singleChoice',
                options: [
                  'Eco de Stress',
                  'Cintilografia Miocárdica',
                  'Teste de Esforço',
                  'RNM de Stress',
                  'Tomografia de Coronárias',
                ],
                condition: { field: 'estratificacao_realizada', value: 'Sim' },
              },
              {
                id: 'resultado_estratificacao',
                label: 'Resultado',
                type: 'singleChoice',
                options: ['Isquêmico', 'Não isquêmico', 'Não realizado'],
                condition: { field: 'estratificacao_realizada', value: 'Sim' },
              },
            ],
            navigation: [{ goTo: 'step_21_procedimento_invasivo' }],
          },
          {
            id: 'step_21_procedimento_invasivo',
            type: 'form',
            label: 'Procedimento Invasivo',
            fields: [
              {
                id: 'cateterismo_realizado',
                label: 'Cateterismo Cardíaco',
                type: 'singleChoice',
                options: ['Não realizado', 'Sim'],
              },
              {
                id: 'resultado_cateterismo',
                label: 'Resultado do Cateterismo',
                type: 'singleChoice',
                options: ['Sem DAC', 'DAC obstrutiva', 'DAC não obstrutiva'],
                condition: { field: 'cateterismo_realizado', value: 'Sim' },
              },
              {
                id: 'angioplastia_realizada',
                label: 'Angioplastia Coronariana',
                type: 'singleChoice',
                options: ['Não realizada', 'Sim'],
              },
              {
                id: 'artérias_angioplastia',
                label: 'Número de Artérias',
                type: 'singleChoice',
                options: ['1 artéria', '2 artérias', '3 ou mais artérias'],
                condition: { field: 'angioplastia_realizada', value: 'Sim' },
              },
            ],
            navigation: [{ goTo: 'step_22_complicacoes' }],
          },
          {
            id: 'step_22_complicacoes',
            type: 'multipleChoice',
            label: 'Complicações',
            options: [
              { label: 'Nenhuma', value: 'nenhuma', exclusive: true },
              { label: 'AIT/AVCi', value: 'ait_avci' },
              { label: 'Fibrilação Atrial', value: 'fa' },
              { label: 'TV/FV', value: 'tv_fv' },
              { label: 'Bloqueio AV com MP', value: 'bloqueio_av_mp' },
              { label: 'PCR Revertida', value: 'pcr_revertida' },
              { label: 'Tamponamento', value: 'tamponamento' },
              { label: 'CIV', value: 'civ' },
              { label: 'IM aguda', value: 'im_aguda' },
              { label: 'Ruptura livre de parede do VE', value: 'ruptura_parede_ve' },
              { label: 'Choque Cardiogênico', value: 'choque_cardiogenico' },
              { label: 'Pericardite pós IAM', value: 'pericardite_pos_iam' },
              { label: 'Reinfarto', value: 'reinfarto' },
              { label: 'Trombose intra-stent', value: 'trombose_intra_stent' },
              { label: 'Insuficiência Respiratória com VM', value: 'ir_vm' },
              { label: 'IRA com diálise', value: 'ira_dialise' },
              { label: 'Sangramento', value: 'sangramento' },
            ],
            navigation: [{ goTo: 'step_23_diagnostico_final' }],
          },
          {
            id: 'step_23_diagnostico_final',
            type: 'form',
            label: 'Diagnóstico Final',
            fields: [
              {
                id: 'diagnostico_principal',
                label: 'Diagnóstico Principal',
                type: 'singleChoice',
                options: [
                  'IAM sem supra ST',
                  'IAM com supra ST',
                  'Dor torácica não cardíaca',
                  'Angina Instável',
                  'Angina estável',
                  'Sd. Aórtica Aguda',
                  'Miocardite',
                  'Pericardite',
                  'Takotsubo',
                  'TEP',
                ],
              },
              {
                id: 'etiology_iam',
                label: 'Etiologia do IAM',
                type: 'singleChoice',
                options: [
                  'DAC Obstrutiva',
                  'DAC não obstrutiva',
                  'Dissecção coronária',
                  'Êmbolo / Trombo',
                  'Trombose de Stent',
                  'Anomalia de coronária',
                  'Vasoespasmo',
                ],
                condition: { field: 'diagnostico_principal', value: ['IAM sem supra ST', 'IAM com supra ST'] },
              },
            ],
            navigation: [{ goTo: 'step_final' }],
          },
          {
            id: 'step_final',
            type: 'info',
            label: 'Protocolo Concluído! Todos os dados foram salvos automaticamente.',
            navigation: [],
          },
        ],
      },
    },
  });
  console.log({ dorToracicaProtocol });
} 

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
