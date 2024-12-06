import React, { useState } from 'react';
import { Box, Typography, Avatar, Grid, Chip, Button, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EventsDisplay = ({ events }) => {
  const navigate = useNavigate();
  const [matchmakingStatus, setMatchmakingStatus] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleMatchmaking = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/matchmake', 
        { eventId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        console.log('Successfully joined matchmaking pool');
        setMatchmakingStatus(prev => ({
          ...prev,
          [eventId]: true
        }));
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      if (error.response?.status === 400) {
        console.log('Already in matchmaking pool');
        setMatchmakingStatus(prev => ({
          ...prev,
          [eventId]: true
        }));
      }
    }
  };

  const handleStartSwiping = async (eventId) => {
    try {
      // Check if there are potential matches before navigating
      const response = await axios.get(
        `http://localhost:5000/matchmaking/potential-matches/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.matches && response.data.matches.length > 0) {
        navigate(`/swipe/${eventId}`);
      } else {
        // Show snackbar if no matches available
        setSnackbar({
          open: true,
          message: 'No new matches available for this event. Try again later!',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error checking matches:', error);
      setSnackbar({
        open: true,
        message: 'Error checking for matches. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!events || !events._embedded || !events._embedded.events) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          borderBottom: '2px solid #8B5CF6',
          pb: 1,
          mb: 3
        }}
      >
        EVENTS NEAR YOU
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {events._embedded.events.map((event, index) => {
          const displayImage = event.images.reduce((prev, current) => {
            return (prev.width > current.width) ? prev : current;
          }).url;

          const eventDate = new Date(event.dates.start.dateTime);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '16px',
                    padding: '20px',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    }
                  }}
                >
                  <Avatar
                    src={displayImage}
                    sx={{
                      width: 140,
                      height: 140,
                      mb: 2,
                      border: '3px solid #8B5CF6',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      mb: 1,
                      fontSize: '1.1rem'
                    }}
                  >
                    {event.name}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Chip
                      icon={<CalendarTodayIcon sx={{ color: '#8B5CF6 !important' }} />}
                      label={formattedDate}
                      sx={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        color: 'white',
                        '& .MuiChip-label': {
                          fontSize: '0.85rem'
                        }
                      }}
                    />
                    <Chip
                      icon={<LocationOnIcon sx={{ color: '#EC4899 !important' }} />}
                      label={`${event._embedded.venues[0].city.name}, ${event._embedded.venues[0].state.stateCode}`}
                      sx={{
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        color: 'white',
                        '& .MuiChip-label': {
                          fontSize: '0.85rem'
                        }
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => matchmakingStatus[event.id] 
                          ? handleStartSwiping(event.id) 
                          : handleMatchmaking(event.id)
                        }
                        startIcon={
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={matchmakingStatus[event.id] ? 'swiping' : 'matchmaking'}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              {matchmakingStatus[event.id] ? <FavoriteIcon /> : <PeopleAltIcon />}
                            </motion.div>
                          </AnimatePresence>
                        }
                        sx={{
                          mt: 2,
                          height: '48px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: matchmakingStatus[event.id]
                            ? 'linear-gradient(45deg, #FF3366 30%, #FF6B6B 90%)'
                            : 'linear-gradient(45deg, #8B5CF6 30%, #6366F1 90%)',
                          boxShadow: matchmakingStatus[event.id]
                            ? '0 3px 5px 2px rgba(255, 51, 102, .3)'
                            : '0 3px 5px 2px rgba(139, 92, 246, .3)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            background: matchmakingStatus[event.id]
                              ? 'linear-gradient(45deg, #FF6B6B 30%, #FF3366 90%)'
                              : 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
                            transform: 'translateY(-2px)',
                            boxShadow: matchmakingStatus[event.id]
                              ? '0 4px 10px 2px rgba(255, 51, 102, .4)'
                              : '0 4px 10px 2px rgba(139, 92, 246, .4)',
                          },
                          '&:active': {
                            transform: 'translateY(1px)',
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'all 0.5s ease-in-out',
                          },
                          '&:hover::before': {
                            left: '100%',
                          }
                        }}
                      >
                        <motion.span
                          key={matchmakingStatus[event.id] ? 'swiping' : 'matchmaking'}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {matchmakingStatus[event.id] ? 'Start Swiping' : 'Matchmake'}
                        </motion.span>
                      </Button>
                    </motion.div>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventsDisplay;