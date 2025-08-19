import React, { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button, Typography, Container, Box, CircularProgress, Alert, List, ListItemButton, ListItemText } from '@mui/material';

// Define a type for the protocol data we expect from the API
interface Protocol {
  id: number;
  title: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"name": "Usuário"}');
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const fetchProtocols = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/protocols`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          // Token is invalid or expired, log the user out
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch protocols');
        }

        const data = await response.json();
        setProtocols(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6">
          Welcome, {user.name || 'User'}!
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout} sx={{ mt: 2, mb: 4 }}>
          Logout
        </Button>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            component={RouterLink}
            to="/open-protocols"
            sx={{ mr: 2 }}
          >
            Protocolos Abertos
          </Button>
        </Box>

        <Typography variant="h5" component="h2" gutterBottom>
          Available Protocols
        </Typography>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {protocols.map((protocol) => (
              <ListItemButton key={protocol.id} component={RouterLink} to={`/protocol/${protocol.id}`}>
                <ListItemText primary={protocol.title} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};