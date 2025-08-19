import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Alert,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

// Define types for the protocol structure
interface ProtocolField {
  id: string;
  label: string;
  type: string;
  options?: string[] | Array<{ label: string; value: string }>;
  condition?: { field: string; value: string | string[] };
}

interface ProtocolStep {
  id: string;
  type: string;
  label: string;
  fields?: ProtocolField[];
  navigation: Array<{ goTo: string; onValue?: string; field?: string }>;
}

interface ProtocolDefinition {
  id: number;
  title: string;
  description: string;
  structureJson: {
    initialStep: string;
    steps: ProtocolStep[];
  };
}

interface ProtocolInstance {
  id: number;
  patientIdentifier: string;
  status: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ProtocolDetailPage = () => {
  const { protocolId, instanceId: urlInstanceId } = useParams<{ protocolId: string; instanceId?: string }>();
  const navigate = useNavigate();
  const [protocol, setProtocol] = useState<ProtocolDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [allStepsData, setAllStepsData] = useState<Record<string, Record<string, any>>>({});
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [instanceId, setInstanceId] = useState<number | null>(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);

  useEffect(() => {
    const fetchProtocolDetails = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !protocolId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/protocols/${protocolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to fetch protocol details');
        }

        const data: ProtocolDefinition = await response.json();
        setProtocol(data);
        setCurrentStep(data.structureJson.initialStep);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolDetails();
  }, [protocolId, navigate]);

  // Carregar instância existente se fornecida
  useEffect(() => {
    if (urlInstanceId && protocol) {
      loadExistingInstance(urlInstanceId);
    }
  }, [urlInstanceId, protocol]);

  // Carregar dados da instância quando instanceId mudar
  useEffect(() => {
    if (instanceId) {
      loadInstanceData();
    }
  }, [instanceId]);

  // Carregar dados do passo atual quando currentStep mudar
  useEffect(() => {
    if (currentStep && allStepsData[currentStep]) {
      const currentStepData = allStepsData[currentStep];
      setStepData(currentStepData);
      console.log('useEffect - step changed to:', currentStep, 'loading data:', currentStepData);
    } else if (currentStep) {
      // Se não há dados para este passo, limpar stepData
      setStepData({});
      console.log('useEffect - step changed to:', currentStep, 'no saved data, clearing stepData');
    }
  }, [currentStep, allStepsData]);

  // Inicializar histórico com o primeiro passo
  useEffect(() => {
    if (currentStep && navigationHistory.length === 0) {
      setNavigationHistory([currentStep]);
      console.log('useEffect - initialized history with:', currentStep);
    }
  }, [currentStep, navigationHistory.length]);

  // Garantir que currentStep sempre tenha um valor válido
  useEffect(() => {
    if (protocol && !currentStep) {
      const initialStep = protocol.structureJson?.initialStep;
      if (initialStep) {
        setCurrentStep(initialStep);
        console.log('useEffect - setting initial step:', initialStep);
      }
    }
  }, [protocol, currentStep]);

  const createProtocolInstance = async () => {
    if (!patientIdentifier.trim()) {
      alert('Por favor, digite um identificador do paciente');
      return;
    }
    
    setCreatingInstance(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/protocols/${protocolId}/instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientIdentifier }),
      });

      if (response.ok) {
        const data = await response.json();
        setInstanceId(data.data.id);
        setShowPatientDialog(false);
        console.log('Instância criada com sucesso:', data.data.id);
        
        // Definir o passo inicial do protocolo
        if (protocol?.structureJson?.initialStep) {
          setCurrentStep(protocol.structureJson.initialStep);
          setNavigationHistory([protocol.structureJson.initialStep]);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao criar instância:', errorData);
        alert(`Erro ao criar instância: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      alert('Erro de conexão. Verifique se o backend está funcionando.');
    } finally {
      setCreatingInstance(false);
    }
  };

  const loadExistingInstance = async (existingInstanceId: string) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/protocols/instances/${existingInstanceId}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInstanceId(parseInt(existingInstanceId));
        
        // Organizar dados por stepId
        const organizedData: Record<string, Record<string, any>> = {};
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            if (item.stepId && item.value) {
              try {
                organizedData[item.stepId] = JSON.parse(item.value);
              } catch (e) {
                organizedData[item.stepId] = item.value;
              }
            }
          });
        }
        
        setAllStepsData(organizedData);
        
        // Determinar o passo atual baseado nos dados salvos
        const lastStep = data.data && data.data.length > 0 ? data.data[0].stepId : null;
        if (lastStep && protocol?.structureJson?.steps) {
          const stepIndex = protocol.structureJson.steps.findIndex(step => step.id === lastStep);
          if (stepIndex >= 0 && stepIndex < protocol.structureJson.steps.length - 1) {
            // Ir para o próximo passo após o último salvo
            setCurrentStep(protocol.structureJson.steps[stepIndex + 1].id);
          } else {
            // Se for o último passo ou não encontrar, ir para o último passo salvo
            setCurrentStep(lastStep);
          }
        } else if (protocol?.structureJson?.steps?.length > 0) {
          // Se não há dados salvos, começar do primeiro passo
          setCurrentStep(protocol.structureJson.steps[0].id);
        }
        
        console.log('Instância existente carregada:', existingInstanceId);
      } else {
        console.error('Erro ao carregar instância existente');
        alert('Erro ao carregar protocolo existente');
      }
    } catch (error) {
      console.error('Error loading existing instance:', error);
      alert('Erro de conexão ao carregar protocolo existente');
    }
  };

  const saveStepData = async (stepId: string, data: any) => {
    if (!instanceId) return;
    
    setSaving(true);
    const token = localStorage.getItem('authToken');
    try {
      await fetch(`${API_URL}/protocols/instances/${instanceId}/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepId, value: data }),
      });
      console.log('Step data saved successfully');
      
      // Atualizar o cache local de dados
      setAllStepsData(prev => ({
        ...prev,
        [stepId]: data
      }));
    } catch (error) {
      console.error('Error saving step data:', error);
    } finally {
      setSaving(false);
    }
  };

  const loadInstanceData = async () => {
    if (!instanceId) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/protocols/instances/${instanceId}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Instance data loaded:', data);
        
        // Organizar dados por stepId
        const organizedData: Record<string, Record<string, any>> = {};
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            if (item.stepId && item.value) {
              organizedData[item.stepId] = item.value;
            }
          });
        }
        
        setAllStepsData(organizedData);
        console.log('All steps data organized:', organizedData);
      }
    } catch (error) {
      console.error('Error loading instance data:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const newStepData = { ...stepData, [fieldId]: value };
    console.log('handleFieldChange:', { fieldId, value, newStepData, currentStep });
    setStepData(newStepData);
    
    // Auto-save after a short delay
    setTimeout(() => {
      saveStepData(currentStep, newStepData);
    }, 1000);
  };

  const getCurrentStep = () => {
    if (!protocol || !currentStep) {
      console.warn('getCurrentStep: protocol or currentStep is missing', { protocol: !!protocol, currentStep });
      return null;
    }
    
    const step = protocol.structureJson.steps.find(step => step.id === currentStep);
    if (!step) {
      console.warn('getCurrentStep: step not found for id:', currentStep);
      return null;
    }
    
    return step;
  };

  const getNextStep = () => {
    const step = getCurrentStep();
    if (!step) return null;

    console.log('getNextStep - current step:', step.id);
    console.log('getNextStep - stepData:', stepData);
    console.log('getNextStep - navigation:', step.navigation);

    // Check conditional navigation first
    for (const nav of step.navigation) {
      if (nav.onValue && nav.field) {
        const fieldValue = stepData[nav.field];
        console.log('getNextStep - checking condition:', { field: nav.field, onValue: nav.onValue, fieldValue, match: fieldValue === nav.onValue });
        if (fieldValue === nav.onValue) {
          console.log('getNextStep - condition matched, going to:', nav.goTo);
          return nav.goTo;
        }
      }
    }

    // Return default navigation (the one without conditions)
    const defaultNav = step.navigation.find(nav => !nav.onValue);
    console.log('getNextStep - no condition matched, using default:', defaultNav?.goTo);
    return defaultNav?.goTo;
  };

  const handleNext = () => {
    const nextStep = getNextStep();
    if (nextStep) {
      // Adicionar passo atual ao histórico antes de mudar
      if (currentStep) {
        setNavigationHistory(prev => [...prev, currentStep]);
        console.log('handleNext - added current step to history:', currentStep);
      }
      
      setCurrentStep(nextStep);
      // Carregar dados do próximo passo se existirem
      const nextStepData = allStepsData[nextStep] || {};
      setStepData(nextStepData);
      console.log('handleNext - moving to step:', nextStep, 'with data:', nextStepData);
    }
  };

  const handleBack = () => {
    // Implementar navegação real usando histórico
    if (navigationHistory.length > 1) {
      // Remover o passo atual do histórico
      const newHistory = navigationHistory.slice(0, -1);
      setNavigationHistory(newHistory);
      
      // Pegar o último passo do histórico (passo anterior)
      const previousStep = newHistory[newHistory.length - 1];
      
      if (previousStep) {
        setCurrentStep(previousStep);
        // Carregar dados do passo anterior se existirem
        const previousStepData = allStepsData[previousStep] || {};
        setStepData(previousStepData);
        console.log('handleBack - moving to step:', previousStep, 'with data:', previousStepData, 'history:', newHistory);
      }
    } else {
      console.log('handleBack - no history to go back to');
    }
  };

  const renderField = (field: ProtocolField) => {
    console.log('renderField: rendering field:', field.id, 'type:', field.type, 'label:', field.label);
    
    const value = stepData[field.id];
    console.log('renderField: field value:', field.id, '=', value);
    
    // Check if field should be hidden due to condition
    if (field.condition) {
      const conditionValue = stepData[field.condition.field];
      console.log('renderField: checking condition:', field.condition, 'conditionValue:', conditionValue);
      if (conditionValue !== field.condition.value) {
        console.log('renderField: field hidden due to condition');
        return null;
      }
    }

    let renderedField = null;

    switch (field.type) {
      case 'text':
        renderedField = (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            margin="normal"
          />
        );
        break;

      case 'number':
        renderedField = (
          <TextField
            key={field.id}
            fullWidth
            type="number"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            margin="normal"
          />
        );
        break;

      case 'date':
        renderedField = (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );
        break;

      case 'time':
        renderedField = (
          <TextField
            key={field.id}
            fullWidth
            type="time"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );
        break;

      case 'singleChoice':
        renderedField = (
          <FormControl key={field.id} component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              {field.options?.map((option: any) => (
                <FormControlLabel
                  key={typeof option === 'string' ? option : option.value}
                  value={typeof option === 'string' ? option : option.value}
                  control={<Radio />}
                  label={typeof option === 'string' ? option : option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        break;

      case 'multipleChoice':
        renderedField = (
          <FormControl key={field.id} component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormGroup>
              {field.options?.map((option: any) => (
                <FormControlLabel
                  key={typeof option === 'string' ? option : option.value}
                  control={
                    <Checkbox
                      checked={Array.isArray(value) ? value.includes(typeof option === 'string' ? option : option.value) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleFieldChange(field.id, [...currentValues, typeof option === 'string' ? option : option.value]);
                        } else {
                          handleFieldChange(field.id, currentValues.filter(v => v !== (typeof option === 'string' ? option : option.value)));
                        }
                      }}
                    />
                  }
                  label={typeof option === 'string' ? option : option.label}
                />
              ))}
            </FormGroup>
          </FormControl>
        );
        break;

      case 'group':
        renderedField = (
          <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {field.label}
            </Typography>
            {field.fields?.map((subField) => {
              const subValue = value?.[subField.id] || '';
              const subHandleChange = (newValue: any) => {
                const currentGroupValue = value || {};
                const updatedGroupValue = { ...currentGroupValue, [subField.id]: newValue };
                handleFieldChange(field.id, updatedGroupValue);
              };

              return (
                <Box key={subField.id} sx={{ mb: 1 }}>
                  {subField.type === 'text' && (
                    <TextField
                      fullWidth
                      label={subField.label}
                      value={subValue}
                      onChange={(e) => subHandleChange(e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  )}
                  {subField.type === 'number' && (
                    <TextField
                      fullWidth
                      label={subField.label}
                      type="number"
                      value={subValue}
                      onChange={(e) => subHandleChange(parseFloat(e.target.value) || 0)}
                      margin="normal"
                      size="small"
                    />
                  )}
                  {subField.type === 'date' && (
                    <TextField
                      fullWidth
                      label={subField.label}
                      type="date"
                      value={subValue}
                      onChange={(e) => subHandleChange(e.target.value)}
                      margin="normal"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  {subField.type === 'time' && (
                    <TextField
                      fullWidth
                      label={subField.label}
                      type="time"
                      value={subValue}
                      onChange={(e) => subHandleChange(e.target.value)}
                      margin="normal"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        );
        break;

      default:
        renderedField = (
          <Typography key={field.id} variant="body2" color="text.secondary">
            Campo não suportado: {field.type}
          </Typography>
        );
        break;
    }

    console.log('renderField: field rendered successfully:', field.id, 'type:', field.type);
    return renderedField;
  };

  const renderStep = () => {
    const step = getCurrentStep();
    if (!step) {
      console.warn('renderStep: step is null or undefined');
      return null;
    }

    console.log('renderStep: rendering step:', step.id, 'with fields:', step.fields);

    if (step.type === 'info') {
      return (
        <Paper elevation={2} sx={{ p: 3, my: 2 }}>
          <Typography variant="h6" gutterBottom>
            {step.label}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Informação do passo
          </Typography>
        </Paper>
      );
    }

    if (!step.fields || step.fields.length === 0) {
      console.warn('renderStep: step has no fields:', step.id);
      return (
        <Paper elevation={2} sx={{ p: 3, my: 2 }}>
          <Typography variant="h6" gutterBottom>
            {step.label}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Este passo não possui campos para preenchimento.
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper elevation={2} sx={{ p: 3, my: 2 }}>
        <Typography variant="h6" gutterBottom>
          {step.label}
        </Typography>
        {step.fields.map((field, index) => {
          const renderedField = renderField(field);
          console.log(`renderStep: field ${index} (${field.id}):`, field, 'rendered:', !!renderedField);
          return renderedField;
        })}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!protocol) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>Protocol not found</Alert>
      </Container>
    );
  }

  // Show patient dialog if no instance exists
  if (!instanceId) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {protocol.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {protocol.description}
          </Typography>
          
          <Dialog open={showPatientDialog} onClose={() => setShowPatientDialog(false)}>
            <DialogTitle>Iniciar Protocolo</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Identificador do Paciente"
                fullWidth
                variant="outlined"
                value={patientIdentifier}
                onChange={(e) => setPatientIdentifier(e.target.value)}
                placeholder="Ex: P12345"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPatientDialog(false)}>Cancelar</Button>
              <Button onClick={createProtocolInstance} variant="contained" disabled={creatingInstance}>
                {creatingInstance ? <CircularProgress size={24} color="inherit" /> : 'Iniciar'}
              </Button>
            </DialogActions>
          </Dialog>

          <Button 
            variant="contained" 
            onClick={() => setShowPatientDialog(true)}
            sx={{ mt: 2 }}
            size="large"
            disabled={creatingInstance}
          >
            {creatingInstance ? 'Criando Protocolo...' : 'Iniciar Protocolo'}
          </Button>

          <Button 
            component={RouterLink} 
            to="/dashboard" 
            variant="outlined" 
            sx={{ mt: 2, ml: 2 }}
          >
            Voltar ao Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  // Render the interactive protocol
  const step = getCurrentStep();
  const nextStep = getNextStep();
  const isLastStep = !nextStep;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {protocol.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Paciente: {patientIdentifier}
        </Typography>

        {/* Progress indicator */}
        <Box sx={{ my: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Passo atual: {step?.label}
          </Typography>
          {saving && (
            <Typography variant="caption" color="primary">
              Salvando...
            </Typography>
          )}
        </Box>

        {/* Current step */}
        {renderStep()}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack} variant="outlined">
            Voltar
          </Button>
          
          {!isLastStep ? (
            <Button 
              onClick={handleNext} 
              variant="contained"
              disabled={saving}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              disabled={saving}
            >
              Concluir Protocolo
            </Button>
          )}
        </Box>

        <Button 
          component={RouterLink} 
          to="/dashboard" 
          variant="outlined" 
          sx={{ mt: 2 }}
        >
          Voltar ao Dashboard
        </Button>
      </Box>
    </Container>
  );
};