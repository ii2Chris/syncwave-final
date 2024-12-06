import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button,
  Chip,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion } from 'framer-motion';
import axios from 'axios';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const events = location.state?.events;
  const [error, setError] = useState(null);

  const handleStartSwiping = async (eventId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/matchmaking/potential-matches/${eventId}`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.matches && response.data.matches.length > 0) {
        navigate(`/swipe/${eventId}`);
      } else {
        setError({ 
          message: 'No potential matches found for this event yet. Try again later!', 
          severity: 'info' 
        });
      }
    } catch (error) {
      setError({ 
        message: error.response?.data?.error || 'Failed to check potential matches', 
        severity: 'error' 
      });
    }
  };

  if (!events || !events._embedded?.events) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
        p: 4 
      }}>
        <Container>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ 
              color: 'white',
              mb: 4
            }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h5" color="white">
            No events found
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
      p: 4 
    }}>
      <Container>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ 
            color: 'white',
            mb: 4
          }}
        >
          Back to Dashboard
        </Button>

        <Typography variant="h4" color="white" sx={{ mb: 4 }}>
          Search Results
        </Typography>

        <Grid container spacing={3}>
          {events._embedded.events.map((event, index) => {
            const eventDate = new Date(event.dates.start.dateTime);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            // Get the highest resolution image
            const displayImage = event.images.reduce((prev, current) => {
              return (prev.width > current.width) ? prev : current;
            }).url;

            return (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={displayImage}
                      alt={event.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" sx={{ color: 'white', mb: 2 }}>
                        {event.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<CalendarTodayIcon sx={{ color: '#8B5CF6 !important' }} />}
                          label={formattedDate}
                          sx={{
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            color: 'white'
                          }}
                        />
                        <Chip
                          icon={<LocationOnIcon sx={{ color: '#EC4899 !important' }} />}
                          label={`${event._embedded.venues[0].city.name}, ${event._embedded.venues[0].state.stateCode}`}
                          sx={{
                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                            color: 'white'
                          }}
                        />
                      </Box>

                      <Button 
                        variant="contained"
                        fullWidth
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          mt: 'auto',
                          backgroundColor: '#EC4899',
                          '&:hover': {
                            backgroundColor: '#D1366B'
                          }
                        }}
                      >
                        Get Tickets
                      </Button>
                      <Button 
                        variant="contained"
                        fullWidth
                        onClick={() => handleStartSwiping(event.id)}
                        sx={{
                          mt: 2,
                          backgroundColor: '#8B5CF6',
                          '&:hover': {
                            backgroundColor: '#6D28D9'
                          }
                        }}
                      >
                        Start Swiping
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Container>
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity={error?.severity} sx={{ width: '100%' }}>
          {error?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchResults; 