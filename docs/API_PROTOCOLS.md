# API de Protocolos - Gerenciador de Protocolos

## Visão Geral

Esta API permite gerenciar protocolos médicos com salvamento automático de dados a cada escolha do usuário.

## Endpoints

### 1. Listar Protocolos Disponíveis
```
GET /api/protocols
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 3,
      "title": "Protocolo de Dor Torácica",
      "description": "Protocolo para avaliação e manejo de pacientes com dor torácica aguda."
    }
  ]
}
```

### 2. Obter Detalhes de um Protocolo
```
GET /api/protocols/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": 3,
  "title": "Protocolo de Dor Torácica",
  "description": "Protocolo para avaliação e manejo de pacientes com dor torácica aguda.",
  "structureJson": {
    "initialStep": "step_1_identificacao",
    "steps": [...]
  }
}
```

### 3. Criar Nova Instância de Protocolo
```
POST /api/protocols/:id/instances
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientIdentifier": "P12345"
}
```

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "protocolDefinitionId": 3,
    "hospitalId": 1,
    "patientIdentifier": "P12345",
    "status": "IN_PROGRESS",
    "createdAt": "2025-08-19T16:30:00.000Z",
    "updatedAt": "2025-08-19T16:30:00.000Z"
  }
}
```

### 4. Salvar Dados do Protocolo (SALVAMENTO AUTOMÁTICO)
```
POST /api/protocols/instances/:instanceId/data
Authorization: Bearer <token>
Content-Type: application/json

{
  "stepId": "step_1_identificacao",
  "value": {
    "numero_atendimento": "P12345",
    "data_nascimento": "1980-05-15",
    "sexo": "Masculino",
    "peso": 75,
    "altura": 175
  }
}
```

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "instanceId": 1,
    "stepId": "step_1_identificacao",
    "value": "{\"numero_atendimento\":\"P12345\",\"data_nascimento\":\"1980-05-15\",\"sexo\":\"Masculino\",\"peso\":75,\"altura\":175}",
    "createdAt": "2025-08-19T16:30:00.000Z",
    "updatedAt": "2025-08-19T16:30:00.000Z",
    "authorId": 1
  }
}
```

### 5. Recuperar Dados Salvos de uma Instância
```
GET /api/protocols/instances/:instanceId/data
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "instanceId": 1,
      "stepId": "step_1_identificacao",
      "value": {
        "numero_atendimento": "P12345",
        "data_nascimento": "1980-05-15",
        "sexo": "Masculino",
        "peso": 75,
        "altura": 175
      },
      "createdAt": "2025-08-19T16:30:00.000Z",
      "updatedAt": "2025-08-19T16:30:00.000Z",
      "authorId": 1
    }
  ]
}
```

### 6. Listar Instâncias do Usuário
```
GET /api/protocols/instances
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "protocolDefinitionId": 3,
      "hospitalId": 1,
      "patientIdentifier": "P12345",
      "status": "IN_PROGRESS",
      "createdAt": "2025-08-19T16:30:00.000Z",
      "updatedAt": "2025-08-19T16:30:00.000Z",
      "protocolDefinition": {
        "title": "Protocolo de Dor Torácica",
        "description": "Protocolo para avaliação e manejo de pacientes com dor torácica aguda."
      },
      "data": [...]
    }
  ]
}
```

## Fluxo de Uso Recomendado

### 1. Iniciar Protocolo
- Faça login e obtenha o token
- Liste os protocolos disponíveis
- Crie uma nova instância para o paciente

### 2. Executar Protocolo com Salvamento Automático
- Para cada passo do protocolo:
  - Preencha os campos
  - Chame `POST /api/protocols/instances/:instanceId/data` para salvar
  - Avance para o próximo passo

### 3. Recuperar Protocolo Pausado
- Liste as instâncias do usuário
- Recupere os dados salvos da instância desejada
- Continue de onde parou

## Tipos de Campos Suportados

- `text`: Texto simples
- `number`: Número
- `date`: Data (formato ISO)
- `time`: Horário
- `singleChoice`: Escolha única (radio button)
- `multipleChoice`: Múltipla escolha (checkboxes)
- `group`: Grupo de campos relacionados
- `info`: Informação apenas leitura

## Lógica de Navegação

O protocolo usa navegação condicional baseada nos valores dos campos:

```json
"navigation": [
  { "onValue": "D", "field": "tipo_dor", "goTo": "step_end_investigacao_especifica" },
  { "goTo": "step_6_ecg_hora" }
]
```

- Se `tipo_dor = "D"`, vai para `step_end_investigacao_especifica`
- Caso contrário, vai para `step_6_ecg_hora`

## Salvamento Automático

**IMPORTANTE:** Chame o endpoint de salvamento a cada mudança para garantir que os dados não sejam perdidos:

```javascript
// Exemplo de uso no frontend
const saveStepData = async (stepId, formData) => {
  try {
    await fetch(`/api/protocols/instances/${instanceId}/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stepId,
        value: formData
      })
    });
    console.log('Dados salvos automaticamente!');
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
};
```

## Status das Instâncias

- `IN_PROGRESS`: Protocolo em andamento
- `COMPLETED`: Protocolo concluído
- `CANCELED`: Protocolo cancelado

## Autenticação

Todos os endpoints requerem autenticação via JWT no header:
```
Authorization: Bearer <token>
```

O token deve ser obtido através do endpoint de login: `POST /api/auth/login`
