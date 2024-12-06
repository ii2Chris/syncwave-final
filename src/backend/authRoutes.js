import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabaseClient from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid'

const { supabase, secret } = supabaseClient;
const router = express.Router();

/**
 * Generates a JWT token for user authentication
 * @param {Object} user - User object containing id and email
 * @returns {string} JWT token
 */
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '24h' });
}

/**
 * @route POST /auth/signup
 * @description Register a new user
 * @access Public
 * 
 * @bodyParam {string} username - Unique username
 * @bodyParam {string} email - User's email address
 * @bodyParam {string} dateOfBirth - User's date of birth
 * @bodyParam {string} phoneNumber - User's phone number
 * @bodyParam {string} password - User's password
 * 
 * @returns {Object} 201 - Account created successfully
 * @returns {Object} 400 - Validation error (email/username/phone already exists)
 * @returns {Object} 500 - Server error
 */
router.post('/signup', async (req, res) => {
  const { username, email, dateOfBirth, phoneNumber, password } = req.body

  try {
    // Check if user already exists by email, username, or phone number
    const { data: existingUser, error: searchError } = await supabase
      .from('user_profile')
      .select('email, username, phone_number')
      .or(`email.eq.${email},username.eq.${username},phone_number.eq.${phoneNumber}`)
      .single()

    if (searchError) {
      console.error('Search error:', searchError)
    }

    // Validate unique email
    if (existingUser?.email === email) {
      console.error('Signup failed: Email already exists')
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Validate unique username
    if (existingUser?.username === username) {
      console.error('Signup failed: Username already exists')
      return res.status(400).json({ message: 'Username already taken' })
    }

    // Validate unique phone number
    if (existingUser?.phone_number === phoneNumber) {
      console.error('Signup failed: Phone number already exists')
      return res.status(400).json({ message: 'Phone number already registered' })
    }

    // Hash password for security
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user profile
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
          about_me: 'i just started using certgram', // Default bio
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

/**
 * @route POST /auth/login
 * @description Authenticate user and return token
 * @access Public
 * 
 * @bodyParam {string} email - User's email address
 * @bodyParam {string} password - User's password
 * 
 * @returns {Object} 200 - Login successful with token
 * @returns {Object} 400 - Missing credentials
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const { data: user, error } = await supabase
      .from('user_profile')
      .select('id, email, encrypted_password, username')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('User search error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      console.error('Login failed: Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate authentication token
    const token = generateAccessToken(user);
    
    // Update user's session token and last login timestamp
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

    // Return success response with token and user data
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

/**
 * @route GET /auth/profile
 * @description Get user profile information
 * @access Private - Requires valid JWT token
 * 
 * @returns {Object} 200 - User profile data
 * @returns {Object} 401 - Invalid or missing token
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
router.get('/profile', async (req, res) => {
  try {
    // Extract and validate JWT token
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

    // Fetch user profile data
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

    // Return user profile data
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

/**
 * @route PATCH /auth/profile
 * @description Update user profile information
 * @access Private - Requires valid JWT token
 * 
 * @bodyParam {string} [about_me] - User's bio
 * @bodyParam {string[]} [interests] - User's interests
 * @bodyParam {string[]} [favourite_artist] - User's favorite artists
 * @bodyParam {string} [gender] - User's gender
 * 
 * @returns {Object} 200 - Updated profile data
 * @returns {Object} 401 - Invalid or missing token
 * @returns {Object} 500 - Server error
 */
router.patch('/profile', async (req, res) => {
  try {
    // Extract and validate JWT token
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

    // Prepare update data
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

    // Update user profile
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

    // Return updated profile data
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

/**
 * @route GET /auth/verify
 * @description Verify JWT token and return user data
 * @access Public
 * 
 * @returns {Object} 200 - Token is valid with user data
 * @returns {Object} 401 - Invalid or missing token
 */
router.get('/verify', async (req, res) => {
  try {
    // Extract and validate token
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

    // Return verification success
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
