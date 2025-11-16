'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link as MuiLink,
  Alert,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const success = await login(data.email, data.password);
      if (success) {
        router.push('/shop');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(60, 36, 21, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(139, 69, 19, 0.3)',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your Sweet Shop account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 3 }}
            />

            <TextField
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 4 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || loading}
              sx={{
                py: 1.5,
                mb: 3,
                background: 'linear-gradient(45deg, #7877c6, #ff77c6)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a5997, #cc5597)',
                },
              }}
            >
              {isSubmitting || loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/register"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up here
                </MuiLink>
              </Typography>
            </Box>
          </Box>

          {/* Demo Credentials */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 2,
              background: 'rgba(120, 119, 198, 0.1)',
              border: '1px solid rgba(120, 119, 198, 0.2)',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Demo Credentials:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin: admin@sweetshop.com / admin123
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Or create a new account to get started
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default LoginPage;
