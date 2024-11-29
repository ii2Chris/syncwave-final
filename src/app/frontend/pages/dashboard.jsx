import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  IconButton,
  Chip,
  Stack
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarIcon from '@mui/icons-material/Star';

const Dashboard = () => {
  const [events, setEvents] = useState([]); 
  const [fetchError, setFetchError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [potentialMatches, setPotentialMatches] = useState({});
  const [matchError, setMatchError] = useState(null);

  

  const fetchEvents = () => {
    axios
      .get('http://localhost:5000/event')
      .then((response) => {
        console.log('Events fetched:', response.data);
        setEvents(response.data.events || []);
        setFetchError(null);
      })
      .catch((error) => {
        console.error('Error fetching events:', error.response?.data || error.message);
        setFetchError('Failed to fetch events. Try again later.');
      });
  };

  const fetchPotentialMatches = async (eventId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/potential-matches/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      setPotentialMatches(prev => ({
        ...prev,
        [eventId]: response.data.matches
      }));
      setMatchError(null);
    } catch (error) {
      console.error('Error fetching matches:', error.response?.data || error.message);
      if (error.response?.status !== 403) { // Don't show error if user hasn't joined pool
        setMatchError('Failed to fetch potential matches.');
      }
    }
  };

  const joinMatchmake = async (event) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/matchmake',
        { eventId: event.id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      setSuccessMessage(`Successfully joined matchmaking for ${event.name}`);
      setJoinError(null);
      // Fetch matches immediately after joining
      fetchPotentialMatches(event.id);
    } catch (error) {
      if (error.response?.status === 400) {
        // If user is already in pool, fetch matches anyway
        fetchPotentialMatches(event.id);
      } else {
        console.error('Error joining matchmaking:', error.response?.data || error.message);
        setJoinError('Failed to join matchmaking. Try again later.');
      }
    }
  };

  // Handle user swipe/match actions
  const handleSwipe = async (eventId, matchUserId, direction) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/swipe',
        {
          eventId,
          matchUserId,
          direction
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      setPotentialMatches(prev => ({
        ...prev,
        [eventId]: prev[eventId].filter(match => match.userId !== matchUserId)
      }));

      // Show match notification if it's a match
      if (response.data.matched) {
        setSuccessMessage("It's a match! 🎉");
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
      setJoinError('Failed to record swipe. Please try again.');
    }
  };


 const renderMatches = (eventId) => {
    const matches = potentialMatches[eventId] || [];
    
    if (matches.length === 0) return null;

    const calculateAge = (birthDate) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Potential Matches:</Typography>
        <Grid container spacing={2}>
          {matches.map((match) => (
            <Grid item xs={12} sm={6} key={match.userId}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={match.profilePicture || '/default-avatar.png'}
                  alt={match.username}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {match.username}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {calculateAge(match.age)} • {match.gender}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ color: 'gold', mr: 0.5 }} />
                      <Typography variant="body2">{match.rating.toFixed(1)}</Typography>
                    </Box>
                  </Stack>
                  {match.favouriteArtists && match.favouriteArtists.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Favorite Artists:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {match.favouriteArtists.map((artist, index) => (
                          <Chip 
                            key={index} 
                            label={artist} 
                            size="small" 
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-around' }}>
                  <IconButton 
                    onClick={() => handleSwipe(eventId, match.userId, 'left')}
                    color="error"
                    size="large"
                  >
                    <ThumbDownIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleSwipe(eventId, match.userId, 'right')}
                    color="success"
                    size="large"
                  >
                    <ThumbUpIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        maxWidth: 1200, // Increased to accommodate matches
        margin: 'auto',
        mt: 5,
        p: 3,
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 3 }} align="center">
        Dashboard
      </Typography>

      <Button
        onClick={fetchEvents}
        variant="outlined"
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
      >
        Find Events
      </Button>

      {fetchError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fetchError}
        </Alert>
      )}

      {joinError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {joinError}
        </Alert>
      )}

      {matchError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {matchError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      {events.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Events:</Typography>
          {events.map((event) => (
            <Box
              key={event.id}
              sx={{
                mt: 2,
                p: 2,
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <Typography variant="subtitle1">{event.name}</Typography>
              <Typography variant="body2">{event.dates?.start?.localDate}</Typography>
              <Button
                onClick={() => joinMatchmake(event)}
                variant="contained"
                color="primary"
                sx={{ mt: 1 }}
              >
                Join Matchmaking
              </Button>
              {renderMatches(event.id)}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;