import express from 'express';
import jwt from 'jsonwebtoken';
import supabaseClient from './supabaseClient.js';

const { supabase, secret } = supabaseClient;
const router = express.Router();

router.post('/matchmake', async (req, res) => {
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
  
      // Fetch user ID from Supabase using the decoded token
      const { data: user, error: userError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('session_token', token)
        .single();
  
      if (userError || !user) {
        console.error('Error fetching user from Supabase:', userError || 'User not found');
        return res.status(404).json({ error: 'User not found' });
      }
  
      const userId = user.id;
  
     
      const { data: existingEntries, error: checkError } = await supabase
        .from('matchmake_pool')
        .select('id, event_id')
        .eq('user_id', userId)
        .eq('event_id', eventId);
  
      if (checkError) {
        console.error('Error checking matchmaking pool2:', checkError);
        return res.status(500).json({ error: 'Failed to check matchmaking pool status2' });
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
          user_id: userId,
        });
  
      if (insertError) {
        console.error('Error inserting user into matchmaking pool4:', insertError);
        return res.status(500).json({ 
          error: 'Failed to join matchmaking pool. Please try again later.' 
        });
      }
  
      res.status(201).json({ 
        message: 'Successfully joined matchmaking pool for the event' 
      });
  
    } catch (error) {
      console.error('Error joining matchmaking3:', error.message || error);
      res.status(500).json({ 
        error: 'Failed to join matchmaking pool. Please try again later.' 
      });
    }
});


router.get('/potential-matches/:eventId', async (req, res) => {
  const { eventId } = req.params;

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

    console.log('Processing request for eventId:', eventId);
    console.log('Decoded token userId:', decodedToken.userId);

    try {
      // Add logging to verify the parameters being sent
      console.log('Calling get_user_matches with:', {
        input_swiper_id: decodedToken.userId,
        input_event_id: eventId
      });

      const { data: matches, error: matchError } = await supabase.rpc('get_user_matches', {
        input_swiper_id: decodedToken.userId,
        input_event_id: eventId
      });

      if (matchError) {
        console.error('Error fetching matches:', matchError);
        return res.status(500).json({ error: 'Failed to retrieve matches', details: matchError });
      }

      // Add logging to check if there are users in the matchmake_pool
      const { data: poolCount, error: poolError } = await supabase
        .from('matchmake_pool')
        .select('count', { count: 'exact' })
        .eq('event_id', eventId);
      
      console.log('Users in matchmake_pool for event:', poolCount);

      console.log('Raw matches data:', JSON.stringify(matches, null, 2));

      const formattedMatches = matches.map(match => ({
        userId: match.user_id,
        username: match.username,
        profilePicture: match.profile_picture_url,
        favouriteArtist: match.favourite_artist,
        rating: match.rating,
        gender: match.gender,
        age: match.date_of_birth,
        aboutMe: match.about_me,
        joinedAt: match.joined_at
      }));

      console.log('Formatted matches:', JSON.stringify(formattedMatches, null, 2));

      res.status(200).json({
        eventId,
        matches: formattedMatches
      });

    } catch (error) {
      console.error('Error in potential matches:', error);
      res.status(500).json({ error: 'Failed to retrieve matches' });
    }
  } catch (error) {
    console.error('Error in token verification:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});






router.post('/swipe', async (req, res) => {
    const { eventId, matchUserId, direction } = req.body;
    if (!matchUserId) {
      return res.status(400).json({ error: 'matchUserId is required' });
    }
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
  
      // Get user info from user_profile
      const { data: user, error: userError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('session_token', token)
        .single();
  
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Get pool entry
      const { data: poolEntry, error: poolError } = await supabase
        .from('matchmake_pool')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();
  
      if (poolError || !poolEntry) {
        console.error('Error fetching pool entry:', poolError);
        return res.status(404).json({ error: 'Pool entry not found' });
      }

      // Log MatchUserId
      console.log('Match User ID before insert:', matchUserId);
  
      // Record the swipe action
      const { error: swipeError } = await supabase
        .from('swipe_actions')
        .insert({
          swiper_id: user.id,
          swiped_user_id: matchUserId,
          pool_id: poolEntry.id,
        });
  
      // Log IDs
      console.log('Swiper ID:', user.id);
      console.log('Swiped User ID:', matchUserId);
  
      if (swipeError) {
        console.error('Error recording swipe:', swipeError);
        return res.status(500).json({ error: 'Failed to record swipe' });
      }
  
      // Check for mutual match if it's a right swipe (like)
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
              event_id: eventId,
            });
  
          if (matchError) {
            console.error('Error creating match:', matchError);
          } else {
            return res.status(200).json({
              message: "It's a match!",
              matched: true,
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

export default router;