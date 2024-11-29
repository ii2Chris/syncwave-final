import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import supabaseClient from './supabaseClient.js';
import jwt from 'jsonwebtoken';

const { supabase, secret } = supabaseClient; // Supabase client setup
dotenv.config(); // Load environment variables

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Function to generate a JWT access token
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '24h' });
}



// Signup route
app.post('/signup', async (req, res) => {
  const { email, password, dateOfBirth, userName, phoneNumber } = req.body;

  if ([email, password, dateOfBirth, userName, phoneNumber].some(field => !field)) {
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

    if (insertError) throw insertError;

    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Signup Error:', error.message || error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Login route
app.post('/login', async (req, res) => {
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

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateAccessToken(user);

    const { error: tokenError } = await supabase
      .from('users')
      .update({
        session_token: token,
        last_sign_in_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (tokenError) {
      console.error('Token Update Error:', tokenError.message);
      return res.status(500).json({ error: 'Failed to update session token.' });
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user.id,
      lastSignIn: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Login Error:', error.message || error);
    res.status(500).json({ error: 'Server error.' });
  }
});





// Define the /event route
app.get('/event', async (req, res) => {
  try {
    // Check if Ticketmaster API key is available
    if (!process.env.TICKETMASTER_KEY) {
      throw new Error('Ticketmaster API key is missing in environment variables.');
    }

    // Fetch events from Ticketmaster API
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&dmaId=345&apikey=${process.env.TICKETMASTER_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Respond with the events data
    const events = data._embedded?.events || [];
    res.status(200).json({ events }); // Send events as JSON
  } catch (error) {
    // Improved error logging
    console.error('Error fetching events:', {
      message: error.message,
      stack: error.stack,
    });

    // Respond with appropriate error
    res.status(500).json({ error: 'Failed to fetch events. Please try again later.' });
  }
});



app.post('/matchmake', async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    // Retrieve and verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    const userEmail = decodedToken.username;

    // Fetch user ID from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('session_token', token)
      .single();

    if (userError || !user) {
      console.error('Error fetching user from Supabase:', userError || 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    // First, verify the event exists
    // const { data: event, error: eventError } = await supabase
    //   .from('events')
    //   .select('id')
    //   .eq('id', eventId)
    //   .single();

    // if (eventError || !event) {
    //   return res.status(404).json({ error: 'Event not found' });
    // }

    // Check if the user is already in the matchmaking pool for this specific event
    const { data: existingEntries, error: checkError } = await supabase
      .from('matchmake_pool')
      .select('id, event_id')
      .eq('user-id', userId)
      .eq('event_id', eventId);

    if (checkError) {
      console.error('Error checking matchmaking pool:', checkError);
      return res.status(500).json({ error: 'Failed to check matchmaking pool status' });
    }

    // If user already has an entry for this specific event, prevent duplicate entry
    if (existingEntries && existingEntries.length > 0) {
      return res.status(400).json({ 
        error: 'You are already in the matchmaking pool for this event.' 
      });
    }

    // Insert the user into the matchmaking pool
    const { error: insertError } = await supabase
      .from('matchmake_pool')
      .insert({
        joined_at: new Date().toISOString(),
        event_id: eventId,
        'user-id': userId,
      });

    if (insertError) {
      console.error('Error inserting user into matchmaking pool:', insertError);
      return res.status(500).json({ 
        error: 'Failed to join matchmaking pool. Please try again later.' 
      });
    }

    res.status(201).json({ 
      message: 'Successfully joined matchmaking pool for the event' 
    });

  } catch (error) {
    console.error('Error joining matchmaking:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to join matchmaking pool. Please try again later.' 
    });
  }
});

app.get('/potential-matches/:eventId', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    // Validate and get user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('session_token', token)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError || 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    // Check if the user is in the matchmaking pool for this event
    const { data: userInPool, error: poolCheckError } = await supabase
      .from('matchmake_pool')
      .select('id')
      .eq('event_id', eventId)
      .eq('user-id', userId)
      .single();

    if (poolCheckError) {
      console.error('Error checking matchmaking pool:', poolCheckError);
      return res.status(500).json({ error: 'Failed to check matchmaking pool status' });
    }

    if (!userInPool) {
      return res.status(403).json({ 
        error: 'You must join the matchmaking pool for this event first' 
      });
    }

    // Get existing swipes for this user in this event's pool
    const { data: existingSwipes, error: swipesError } = await supabase
      .from('swipe_actions')
      .select('swiped_user_id')
      .eq('swiper_id', userId)
      .eq('pool_id', userInPool.id);

    if (swipesError) {
      console.error('Error fetching existing swipes:', swipesError);
      return res.status(500).json({ error: 'Failed to check existing swipes' });
    }

    const swipedUserIds = existingSwipes?.map(swipe => swipe.swiped_user_id) || [];

    // Get all users in the pool for this event except the current user
    // and excluding already swiped users
    const { data: poolUsers, error: poolError } = await supabase
      .from('matchmake_pool')
      .select(`
        id,
        joined_at,
        user-id,
        users!inner (
          id,
          username
        ),
        user_profile!inner (
          favourite_artist,
          rating,
          profile_url,
          gender,
          age
        )
      `)
      .eq('event_id', eventId)
      .neq('user-id', userId)
      .not('user-id', 'in', `(${swipedUserIds.join(',')})`);

    if (poolError) {
      console.error('Error fetching pool users:', poolError);
      return res.status(500).json({ error: 'Failed to retrieve potential matches' });
    }

    // Format the response
    const formattedMatches = poolUsers.map(match => ({
      matchId: match.id,
      userId: match.users.id,
      username: match.users.username,
      profilePicture: match.user_profile.profile_url,
      favouriteArtists: match.user_profile.favourite_artist,
      rating: match.user_profile.rating,
      gender: match.user_profile.gender,
      age: match.user_profile.age,
      joinedAt: match.joined_at
    }));

    res.status(200).json({
      eventId,
      matches: formattedMatches
    });

  } catch (error) {
    console.error('Error retrieving potential matches:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to retrieve potential matches. Please try again later.' 
    });
  }
});

// Add swipe endpoint
app.post('/swipe', async (req, res) => {
  const { eventId, matchUserId, direction } = req.body;
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('session_token', token)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get pool entry
    const { data: poolEntry, error: poolError } = await supabase
      .from('matchmake_pool')
      .select('id')
      .eq('event_id', eventId)
      .eq('user-id', user.id)
      .single();

    if (poolError || !poolEntry) {
      return res.status(404).json({ error: 'Pool entry not found' });
    }

    // Record the swipe action
    const { error: swipeError } = await supabase
      .from('swipe_actions')
      .insert({
        swiper_id: user.id,
        swiped_user_id: matchUserId,
        pool_id: poolEntry.id
      });

    if (swipeError) {
      console.error('Error recording swipe:', swipeError);
      return res.status(500).json({ error: 'Failed to record swipe' });
    }

    // If it's a right swipe (like), check for mutual match
    if (direction === 'right') {
      const { data: mutualSwipe, error: mutualError } = await supabase
        .from('swipe_actions')
        .select('*')
        .eq('swiper_id', matchUserId)
        .eq('swiped_user_id', user.id)
        .single();

      if (mutualError) {
        console.error('Error checking mutual swipe:', mutualError);
      } else if (mutualSwipe) {
        // Create a match
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            userid_1: user.id,
            userid_2: matchUserId,
            event_id: eventId
          });

        if (matchError) {
          console.error('Error creating match:', matchError);
        } else {
          return res.status(200).json({ 
            message: 'It\'s a match!',
            matched: true 
          });
        }
      }
    }

    res.status(200).json({ message: 'Swipe recorded', matched: false });

  } catch (error) {
    console.error('Error processing swipe:', error);
    res.status(500).json({ error: 'Failed to process swipe' });
  }
});


// Universal 404 route (placed at the end of the routes)

app.use((req, res) => {
  res.status(404).json({ error: 'URL not found.' });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

