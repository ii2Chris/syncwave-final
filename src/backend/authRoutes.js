import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabaseClient from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid'

const { supabase, secret } = supabaseClient;
const router = express.Router();

// Function to generate JWT
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '24h' });
}


// Signup route
router.post('/signup', async (req, res) => {
  const { username, email, dateOfBirth, phoneNumber, password } = req.body

  try {
    // Check if user already exists
    const { data: existingUser, error: searchError } = await supabase
      .from('user_profile')
      .select('email, username, phone_number')
      .or(`email.eq.${email},username.eq.${username},phone_number.eq.${phoneNumber}`)
      .single()

    if (searchError) {
      console.error('Search error:', searchError)
    }

    if (existingUser?.email === email) {
      console.error('Signup failed: Email already exists')
      return res.status(400).json({ message: 'Email already registered' })
    }

    if (existingUser?.username === username) {
      console.error('Signup failed: Username already exists')
      return res.status(400).json({ message: 'Username already taken' })
    }

    if (existingUser?.phone_number === phoneNumber) {
      console.error('Signup failed: Phone number already exists')
      return res.status(400).json({ message: 'Phone number already registered' })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const { data: newUser, error } = await supabase
      .from('user_profile')
      .insert([
        {
          username,
          email,
          date_of_birth: dateOfBirth,
          encrypted_password: hashedPassword,
          phone_number: parseInt(phoneNumber.replace(/\D/g, '')), // Convert phone to bigint
          rating: 1,
          about_me: 'i just started using certgram', // Using default from schema
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ 
        message: 'Error creating account',
        error: error.message 
      })
    }

    // Log successful creation
    console.log('User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    })

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    })

  } catch (error) {
    console.error('Unexpected error during signup:', error)
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: error.message 
    })
  }
})

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('user_profile')
      .select('id, email, encrypted_password, username')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('User search error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      console.error('Login failed: Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateAccessToken(user);
    
    // Update session token and last login
    const { error: updateError } = await supabase
      .from('user_profile')
      .update({
        session_token: token,
        last_login: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Token Update Error:', updateError.message);
      return res.status(500).json({ error: 'Failed to update session token.' });
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      lastLogin: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Login Error:', error.message || error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from database
    const { data: user, error } = await supabase
      .from('user_profile')
      .select(`
        id,
        username,
        email,
        about_me,
        interests,
        favourite_artist,
        gender,
        profile_picture_url
      `)
      .eq('id', decodedToken.userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      about_me: user.about_me,
      interests: user.interests || [],
      favourite_artist: user.favourite_artist || [],
      gender: user.gender,
      profile_picture_url: user.profile_picture_url
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.patch('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const updateData = {};
    const allowedFields = ['about_me', 'interests', 'favourite_artist', 'gender'];
    
    // Only include fields that are present in the request
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Handle arrays for interests and favourite_artist
        if (['interests', 'favourite_artist'].includes(field) && typeof req.body[field] === 'string') {
          updateData[field] = req.body[field].split(',').map(item => item.trim());
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const { data: user, error } = await supabase
      .from('user_profile')
      .update(updateData)
      .eq('id', decodedToken.userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        about_me: user.about_me,
        interests: user.interests || [],
        favourite_artist: user.favourite_artist || [],
        gender: user.gender,
        profile_picture_url: user.profile_picture_url
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, secret);

    // Check if user exists and token matches
    const { data: user, error } = await supabase
      .from('user_profile')
      .select('id, username')
      .eq('session_token', token)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(200).json({ 
      verified: true, 
      user: {
        id: user.id,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
