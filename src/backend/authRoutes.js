import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabaseClient from '../supabaseClient.js';

const { supabase, secret } = supabaseClient;
const router = express.Router();

// Function to generate JWT
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '24h' });
}


// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, dateOfBirth, userName, phoneNumber } = req.body;

  if ([email, password, dateOfBirth, userName, phoneNumber].some(field => !field)) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('users')
      .insert({ email, username: userName, encrypted_password: passwordHash, date_of_birth: dateOfBirth, phone_number: phoneNumber });

    if (error) throw error;
    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, encrypted_password')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateAccessToken(user);
    res.status(200).json({ message: 'Login successful', token, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
