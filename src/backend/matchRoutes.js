import express from 'express';
import jwt from 'jsonwebtoken';
import supabaseClient from './supabaseClient.js';

const { supabase, secret } = supabaseClient;
const router = express.Router();

router.post('/matchmake', async (req, res) => {
  console.log('Received matchmake request for eventId:', req.body.eventId);
  
  const { eventId } = req.body;
  if (!eventId) {
    console.log('Error: No eventId provided in request');
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    // Retrieve and verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('Error: No authorization token provided');
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
      console.log('Token verified for user:', decodedToken);
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    // Fetch user ID from Supabase
    console.log('Fetching user profile with token:', token);
    const { data: user, error: userError } = await supabase
      .from('user_profile')
      .select('id')
      .eq('session_token', token)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError || 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    console.log('Found user ID:', userId);

    // Fetch event details from Ticketmaster
    console.log('Fetching event details from Ticketmaster for eventId:', eventId);
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventId}?apikey=${process.env.TICKETMASTER_KEY}`;
    const response = await fetch(ticketmasterUrl);
    const eventData = await response.json();

    if (!eventData) {
      console.log('No event data returned from Ticketmaster');
      return res.status(404).json({ error: 'Event not found on Ticketmaster' });
    }
    console.log('Retrieved event data from Ticketmaster:', {
      name: eventData.name,
      venue: eventData._embedded?.venues?.[0]?.name,
      date: eventData.dates.start.dateTime
    });

    // Get highest resolution image
    const eventImage = eventData.images
      ? eventData.images.reduce((prev, current) => {
          return (prev.width > current.width) ? prev : current;
        }).url
      : null;
  //  console.log('Selected event image URL:', eventImage);

    // Check for existing event
    console.log('Checking if event exists in database');
    const { data: existingEvent } = await supabase
      .from('event')
      .select('event_id')
      .eq('event_id', eventId)
      .single();

    // Insert event if it doesn't exist
    if (!existingEvent) {
      console.log('Event does not exist, preparing to insert');
      const eventInsertData = {
        event_id: eventId,
        event_artist_name: eventData.name,
        event_venue: eventData._embedded?.venues?.[0]?.name || 'Unknown Venue',
        event_date: eventData.dates.start.dateTime,
        event_location: `${eventData._embedded?.venues?.[0]?.city?.name || 'Unknown City'}, ${eventData._embedded?.venues?.[0]?.state?.stateCode || 'Unknown State'}`,
        event_ticket_url: eventData.url,
        event_image: eventImage
      };
      //console.log('Inserting event with data:', eventInsertData);

      const { error: eventError } = await supabase
        .from('event')
        .insert(eventInsertData);

      if (eventError) {
        console.error('Failed to insert event:', eventError);
        return res.status(500).json({ error: 'Failed to store event details' });
      }
      console.log('Successfully inserted event');
    } else {
      console.log('Event already exists in database');
    }
   
    // Check for existing matchmaking entry
   // console.log('Checking for existing matchmaking entry');
    const { data: existingEntries, error: checkError } = await supabase
      .from('matchmake_pool')
      .select('id, event_id')
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (checkError) {
      console.error('Error checking matchmaking pool:', checkError);
      return res.status(500).json({ error: 'Failed to check matchmaking pool status' });
    }

    if (existingEntries && existingEntries.length > 0) {
      console.log('User already in matchmaking pool for this event');
      return res.status(400).json({ 
        error: 'You are already in the matchmaking pool for this event.' 
      });
    }

    // Insert into matchmaking pool
    //console.log('Inserting user into matchmaking pool');
    const { error: insertError } = await supabase
      .from('matchmake_pool')
      .insert({
        joined_at: new Date().toISOString(),
        event_id: eventId,
        user_id: userId,
      });

    if (insertError) {
      console.error('Failed to insert into matchmaking pool:', insertError);
      return res.status(500).json({ 
        error: 'Failed to join matchmaking pool. Please try again later.' 
      });
    }

   // console.log('Successfully added user to matchmaking pool');
    res.status(201).json({ 
      message: 'Successfully joined matchmaking pool for the event' 
    });

  } catch (error) {
    console.error('Matchmaking process failed:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to join matchmaking pool. Please try again later.' 
    });
  }
});


router.get('/matchmaking/potential-matches/:eventId', async (req, res) => {
  const { eventId } = req.params;
  console.log('Fetching potential matches for eventId:', eventId);

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No authorization token provided');
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
      console.log('Decoded token:', decodedToken);
    } catch (err) {
      console.log('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get the current user's ID
    const { data: currentUser, error: userError } = await supabase
      .from('user_profile')
      .select('id')
      .eq('session_token', token)
      .single();

    if (userError || !currentUser) {
      console.error('Error fetching current user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Current user ID:', currentUser.id);

    // First get the pool_id for this event
    const { data: poolEntry, error: poolError } = await supabase
      .from('matchmake_pool')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', currentUser.id)
      .single();

    if (poolError) {
      console.error('Error fetching pool entry:', poolError);
      return res.status(500).json({ error: 'Failed to fetch pool entry' });
    }
    console.log('Pool entry:', poolEntry);

    // Get swiped users using pool_id
    const { data: swipedUsers, error: swipeError } = await supabase
      .from('swipe_actions')
      .select('swiped_user_id')
      .eq('swiper_id', currentUser.id)
      .eq('pool_id', poolEntry.id);

    if (swipeError) {
      console.error('Error fetching swiped users:', swipeError);
      return res.status(500).json({ error: 'Failed to fetch swiped users' });
    }

    const swipedUserIds = swipedUsers ? swipedUsers.map(swipe => swipe.swiped_user_id) : [];
    console.log('Already swiped user IDs:', swipedUserIds);

    // Fetch potential matches from the same event's pool
    console.log('Fetching matches with query parameters:', {
      eventId,
      currentUserId: currentUser.id,
      swipedUserIds
    });

    const { data: matches, error: matchError } = await supabase
      .from('matchmake_pool')
      .select(`
        user_id,
        user_profile:user_id (
          username,
          profile_picture_url,
          interests,
          favourite_artist,
          gender,
          date_of_birth,
          about_me
        )
      `)
      .eq('event_id', eventId)
      .neq('user_id', currentUser.id);

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return res.status(500).json({ error: 'Failed to fetch potential matches' });
    }

    // Filter out already swiped users
    const filteredMatches = matches.filter(match => 
      !swipedUserIds.includes(match.user_id)
    );
    
    console.log('Raw matches data:', filteredMatches);

    // Format the response
    const formattedMatches = filteredMatches.map(match => ({
      userId: match.user_id,
      username: match.user_profile.username,
      profilePicture: match.user_profile.profile_picture_url,
      interests: match.user_profile.interests,
      favouriteArtist: match.user_profile.favourite_artist,
      gender: match.user_profile.gender,
      age: match.user_profile.date_of_birth,
      aboutMe: match.user_profile.about_me
    }));

    console.log('Formatted matches:', formattedMatches);

    res.status(200).json({
      eventId,
      matches: formattedMatches
    });

  } catch (error) {
    console.error('Error in potential matches:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});






router.post('/matchmaking/swipe', async (req, res) => {
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
          const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
              userid_1: user.id,
              userid_2: matchUserId,
              event_id: eventId,
            })
            .select()
            .single();
  
          if (matchError) {
            console.error('Error creating match:', matchError);
          } else {
            // Create a chat room for the match
            const { error: chatError } = await supabase
              .from('chat_rooms')
              .insert({
                match_id: match.id,
                user1_id: user.id,
                user2_id: matchUserId,
                event_id: eventId
              });
  
            if (chatError) {
              console.error('Error creating chat room:', chatError);
            }
  
            return res.status(200).json({
              message: "It's a match!",
              matched: true,
              matchId: match.id
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