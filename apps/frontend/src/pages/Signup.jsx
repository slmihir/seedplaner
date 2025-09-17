import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Container, TextField, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h5" gutterBottom>Sign Up</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" required />
        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 2 }}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>Have an account? <Link to="/login">Login</Link></Typography>
    </Container>
  );
}

