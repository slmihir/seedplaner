import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Box, 
  Alert, 
  Card, 
  CardContent,
  Divider,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Add client-side validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email, passwordLength: password.length });
      await login(email, password);
      console.log('Login successful');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      
      // Provide helpful hints for common errors
      if (errorMessage.includes('Invalid credentials')) {
        setError(`${errorMessage}. Please check your email and password. Try: admin@example.com / admin123`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to SeedPlanner
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom align="center">
            Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField 
              label="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              fullWidth 
              margin="normal" 
              required 
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              fullWidth 
              margin="normal" 
              required 
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={loading} 
              sx={{ mt: 3, mb: 2 }} 
              aria-busy={loading} 
              aria-label="Login"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon color="primary" />
                <Typography variant="body2">Demo Credentials</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Use these credentials to test the application:
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="Admin" 
                    color="primary" 
                    size="small" 
                    onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Typography variant="body2">admin@example.com / admin123</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="Manager" 
                    color="secondary" 
                    size="small" 
                    onClick={() => handleQuickLogin('manager@example.com', 'manager123')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Typography variant="body2">manager@example.com / manager123</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="Developer" 
                    color="info" 
                    size="small" 
                    onClick={() => handleQuickLogin('dev@example.com', 'dev12345')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Typography variant="body2">dev@example.com / dev12345</Typography>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
            No account? <Link to="/signup">Sign up</Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

