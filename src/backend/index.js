import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import supabaseClient from './supabaseClient.js'; 
const { supabase, secret } = supabaseClient;     
import jwt from 'jsonwebtoken'; 

//backend initalization
dotenv.config(); // Load environment variables
const app = express();
const PORT = 5000;

//middlewares 

app.use(cors());
app.use(bodyParser.json());



// Function to generate a JWT access token
function generateAccessToken(username) {
  return jwt.sign({ username }, secret, { expiresIn: '1800s' });
}

app.listen(PORT, () => {
  console.log(`list4ning on http://localhost:${PORT}`);
});

//universal route
app.get("/:universalURL",(req,res)=>{
  res.send("404 URL NOT FOUND");
})

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

// Login route with JWT session token
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Fetch user from Supabase by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, encrypted_password')  // Fetch necessary fields
      .eq('email', email)
      .single();  // Since we're expecting one result (user)

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token after successful password match,session token, will be used in the authorization for any other api calls made
    const token = generateAccessToken(user.email); 

    // Send response with token
    return res.status(200).json({
      message: 'Login successful',
      token: token,  // Include the token in the response
      userId: user.id,
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

