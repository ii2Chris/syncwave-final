import React from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';

const Login = () => {
  const {
    register, // Use 'register' here
    handleSubmit,
    formState: { errors },
  } = useForm();

  
  const onSubmit = (data) => {
    // Perform login API call here
    axios
      .post('http://localhost:5000/login', data) // Use POST instead of GET
      .then((response) => {
        console.log('Login success:', response.data);
        // Handle success (e.g., show a success message or redirect user)
      })
      .catch((error) => {
        console.error('Login error:', error.response?.data || error.message);
        // Handle error (e.g., show an error message)
      });
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: 'auto',
        mt: 5,
        p: 3,
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 3 }} align="center">
        Login
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        
        <TextField 
          label="Email"
          type="email"
          fullWidth
          sx={{ mb: 2 }}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Enter a valid email address',
            },
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          sx={{ mb: 2 }}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters long',
            },
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Login
        </Button>
      </form>

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Please fix the errors above.
        </Alert>
      )}
    </Box>
  );
};

export default Login;
