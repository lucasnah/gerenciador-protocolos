import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface OpenProtocol {
  id: number;
  patientIdentifier: string;
  status: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
  protocolDefinition: {
    id: number;
    title: string;
    description: string;
  };
  hospital: {
    id: number;
    name: string;
  };
  collaborators: Array<{
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  data: Array<{
    stepId: string;
    author: {
      id: number;
      name: string;
    };
  }>;
}

const OpenProtocolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<OpenProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<OpenProtocol | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  useEffect(() => {
    fetchOpenProtocols();
  }, []);

  const fetchOpenProtocols = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/protocols/open`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProtocols(data.protocols || []);
      } else {
        setError('Erro ao carregar protocolos abertos');
      }
    } catch (error) {
      console.error('Error fetching open protocols:', error);
      setError('Erro de conexão ao carregar protocolos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleContinueProtocol = (protocol: OpenProtocol) => {
    navigate(`/protocol/${protocol.protocolDefinition.id}/instance/${protocol.id}`);
  };

  const handleAssignProtocol = (protocol: OpenProtocol) => {
    setSelectedProtocol(protocol);
    setShowAssignDialog(true);
    fetchUsers();
  };

  const handleConfirmAssign = async () => {
    if (!selectedProtocol || !selectedUserId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/protocols/instances/${selectedProtocol.id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (response.ok) {
        setShowAssignDialog(false);
        setSelectedProtocol(null);
        setSelectedUserId('');
        fetchOpenProtocols(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Erro ao atribuir protocolo: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      alert('Erro de conexão ao atribuir protocolo');
    }
  };

  const handleUpdateStatus = async (protocol: OpenProtocol, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/protocols/instances/${protocol.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOpenProtocols(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Erro ao atualizar status: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro de conexão ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'primary';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'PAUSED':
        return 'Pausado';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Protocolos Abertos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Protocolos em andamento que podem ser continuados por outros profissionais
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Protocolo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Colaboradores</TableCell>
              <TableCell>Última Atualização</TableCell>
              <TableCell>Último Editor</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {protocols.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum protocolo aberto encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              protocols.map((protocol) => (
                <TableRow key={protocol.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {protocol.patientIdentifier}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {protocol.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {protocol.protocolDefinition.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(protocol.status)}
                      color={getStatusColor(protocol.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {protocol.collaborators.map((collaborator, index) => (
                        <Chip
                          key={index}
                          label={collaborator.user.name}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(protocol.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {protocol.data.length > 0 ? protocol.data[0].author.name : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleContinueProtocol(protocol)}
                      >
                        Continuar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAssignProtocol(protocol)}
                      >
                        Atribuir
                      </Button>
                      {protocol.status === 'IN_PROGRESS' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleUpdateStatus(protocol, 'PAUSED')}
                        >
                          Pausar
                        </Button>
                      )}
                      {protocol.status === 'PAUSED' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleUpdateStatus(protocol, 'IN_PROGRESS')}
                        >
                          Retomar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for assigning protocol */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Atribuir Protocolo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selecione um profissional para colaborar no protocolo:
          </Typography>
          <TextField
            select
            fullWidth
            label="Profissional"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            margin="normal"
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name} ({user.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmAssign}
            variant="contained"
            disabled={!selectedUserId}
          >
            Atribuir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OpenProtocolsPage;
