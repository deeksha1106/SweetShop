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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const { register: registerUser, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    
    if (!data.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      const success = await registerUser(data.email, data.password);
      if (success) {
        router.push('/shop');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
              Join Sweet Shop
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your account and start your sweet journey
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
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z\d])/,
                  message: 'Password must contain at least one lowercase letter and one uppercase letter or number',
                },
              })}
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 3 }}
            />

            <TextField
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              fullWidth
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms and conditions',
                  })}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the{' '}
                  <MuiLink href="#" sx={{ color: 'primary.main' }}>
                    Terms of Service
                  </MuiLink>{' '}
                  and{' '}
                  <MuiLink href="#" sx={{ color: 'primary.main' }}>
                    Privacy Policy
                  </MuiLink>
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {errors.agreeToTerms && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.agreeToTerms.message}
              </Alert>
            )}

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
                'Create Account'
              )}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign in here
                </MuiLink>
              </Typography>
            </Box>
          </Box>

          {/* Features Preview */}
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
              <strong>What you'll get:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Access to premium sweet collections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Purchase history and tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Personalized recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Exclusive member discounts
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;
