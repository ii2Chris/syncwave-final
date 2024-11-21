import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {supabase} from './supabaseClient.js'

// Now you can use the 'supabase' client directly

dotenv.config(); // Load environment variables
const app = express();
//const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Express backend!' });
});

// Signup route
app.post('/signup', async (req, res) => {
  const { email, password, dateOfBirth, userName, phoneNumber } = req.body;

  if (!email || !password || !dateOfBirth || !userName || !phoneNumber) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        username: userName,
        encrypted_password: passwordHash,
        date_of_birth: dateOfBirth,
        phone_number: phoneNumber,
      });

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Start the server

//const PORT = process.env.PORT || 5000;
const PORT =  5000;

//const PORT = import.meta.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
