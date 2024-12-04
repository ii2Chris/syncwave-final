import express from 'express';
import jwt from 'jsonwebtoken';
import supabaseClient from './supabaseClient';

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
      // Validate and decode the token
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
  
      // Retrieve user ID based on the session token
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
  
      // Check if the user is part of the matchmaking pool for the given event
      const { data: userInPool, error: poolCheckError } = await supabase
        .from('matchmake_pool')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
  
      if (poolCheckError) {
        console.error('Error checking matchmaking pool1:', poolCheckError);
        return res.status(500).json({ error: 'Failed to check matchmaking pool status1' });
      }
  
      if (!userInPool) {
        return res.status(403).json({
          error: 'You must join the matchmaking pool for this event first',
        });
      }
  
      // Fetch existing swipes for the user in the event's pool
      const { data: existingSwipes, error: swipesError } = await supabase
        .from('swipe_actions')
        .select('swiped_user_id')
        .eq('swiper_id', userId)
        .eq('pool_id', userInPool.id);
  
      if (swipesError) {
        console.error('Error fetching existing swipes:', swipesError);
        return res.status(500).json({ error: 'Failed to check existing swipes' });
      }
  
      const swipedUserIds = existingSwipes?.map((swipe) => swipe.swiped_user_id) || [];
  
      // Retrieve potential matches from the matchmaking pool
      const { data: poolUsers, error: poolError } = await supabase
        .from('matchmake_pool')
        .select(`
          id,
          joined_at,
          user_id,
          users:users(id, username), 
          user_profile:user_profiles(favourite_artist, rating, profile_url, gender, age)
        `)
        .eq('event_id', eventId)
        .neq('user_id', userId)  
        .not('user_id', 'in', `(${swipedUserIds.join(',')}))`); 

      if (poolError) {
        console.error('Error fetching pool users:', poolError);
        return res.status(500).json({ error: 'Failed to retrieve potential matches' });
      }

      // Log the poolUsers to debug data
      console.log('Fetched poolUsers:', poolUsers);

      // Format the response
      const formattedMatches = poolUsers.map((match) => {
        // Log individual match data to debug
        console.log('Match Data:', match);

        return {
          matchId: match.id,
          userId: match.users.id,
          username: match.users.username,
          profilePicture: match.user_profile.profile_url,
          favouriteArtists: match.user_profile.favourite_artist,
          rating: match.user_profile.rating,
          gender: match.user_profile.gender,
          age: match.user_profile.age,
          joinedAt: match.joined_at,
        };
      });

      res.status(200).json({
        eventId,
        matches: formattedMatches,
      });
    } catch (error) {
      console.error('Error fetching potential matches:', error);
      res.status(500).json({ error: 'Failed to retrieve potential matches' });
    }
}); // Added missing closing bracket here


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
  
      // Get user info
      const { data: user, error: userError } = await supabase
        .from('users')
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