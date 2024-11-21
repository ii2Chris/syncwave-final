import React from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';


const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login'); // Navigate to /login when the button is clicked
  };

  const onSubmit = (data) => {
    //console.log('Signup Data:', data);
    // Perform signup API call here
    axios.post('http://localhost:5000/signup', data)
    .then((response) => {
      console.log('Signup success:', response.data);
      // Handle success (e.g., show a success message or redirect user)
    })
    .catch((error) => {
      console.error('Signup error:', error.response?.data || error.message);
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
        Sign Up
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="User Name"
          fullWidth
          sx={{ mb: 2 }}
          
          {...register('userName', { 
            required: 'UserName is required', 
            maxLength: {
              value: 10,
              message: 'User Name cannot be longer than 10 characters'
            }
          })}
          error={!!errors.userName}
          helperText={errors.userName?.message}
        />
        
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

        <TextField
          label=""
          type="date"
          fullWidth
          sx={{ mb: 2 }}
          {...register('dateOfBirth', { required: 'Date of Birth is required' })}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth?.message}
        />

<TextField
          label="PhoneNumber"
          type="tel"
          fullWidth
          sx={{ mb: 2 }}
          {...register('phoneNumber', { required: 'Phone Number is required' })}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber?.message}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Sign Up
        </Button>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLoginClick}
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

export default Signup;
