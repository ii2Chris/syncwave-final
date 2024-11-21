import React from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    axios.post('http://localhost:5000/login', {
      email: data.email,
      password: data.password,
    })
    .then((response) => {
      console.log('Login successful:', response.data);  // Log the entire response object
  
  //  storing  the token in localStorage or cookies here
      localStorage.setItem('authToken', response.data.token);
  
      // You can then redirect or do something else with the token
    })
    .catch((error) => {
      console.error('Login error:', error.response?.data || error.message);
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

      <form onSubmit={handleSubmit(onSubmit)} method="POST">

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
