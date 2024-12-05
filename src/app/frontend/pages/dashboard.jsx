import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Dashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/event', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setEvents(response.data.events || []);
      setError(null);
    } catch (error) {
      setError('Failed to fetch events');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Chats', icon: <ChatIcon />, path: '/chats' },
    { text: 'Friends', icon: <PeopleIcon />, path: '/friends' },
    { text: 'Event', icon: <EventIcon />, path: '/events' },
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100vw',
        background: `url('/src/background.webp') no-repeat center center fixed`,
        backgroundSize: 'cover',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        },
      }}
    >
      {/* Menu Button */}
      <IconButton
        onClick={() => setDrawerOpen(true)}
        sx={{ 
          position: 'fixed', 
          top: 20, 
          left: 20, 
          color: 'white',
          zIndex: 1200,
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Pop-up Sidebar */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          zIndex: 1300,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: 'rgba(17, 17, 17, 0.95)',
            color: 'white',
            borderRight: '1px solid #333',
            zIndex: 1300,
          },
          '& .MuiBackdrop-root': {
            zIndex: 1299,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ color: '#8B5CF6' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Dashboard
          </Typography>
        </Box>
        <List>
          {sidebarItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#8B5CF6' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box 
        sx={{ 
          position: 'relative',
          zIndex: 2,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            mb: 2,
            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            cursor: 'default',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              textShadow: '0 0 10px #8B5CF6, 0 0 20px #8B5CF6, 0 0 30px #8B5CF6',
              background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            },
          }}
        >
          MEET
        </Typography>
        <Typography 
          variant="h1" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            mb: 2,
            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            cursor: 'default',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              textShadow: '0 0 10px #EC4899, 0 0 20px #EC4899, 0 0 30px #EC4899',
              background: 'linear-gradient(45deg, #EC4899, #8B5CF6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            },
          }}
        >
          YOUR
        </Typography>
        <Typography 
          variant="h1" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            cursor: 'default',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px) scale(1.05)',
              textShadow: '0 0 10px #8B5CF6, 0 0 20px #EC4899, 0 0 30px #8B5CF6',
              background: 'linear-gradient(45deg, #8B5CF6, #EC4899, #8B5CF6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.1em',
            },
          }}
        >
          CONCERT CREW
        </Typography>

        {/* Optional: Add a subtle animation to draw attention to the hover effect */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            animation: 'fadeInOut 2s infinite',
            '@keyframes fadeInOut': {
              '0%, 100%': { opacity: 0 },
              '50%': { opacity: 1 },
            },
          }}
        >
          Hover over text
        </Box>
      </Box>

      {/* Near Me Button */}
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1200 }}>
        <Button
          variant="contained"
          startIcon={<LocationOnIcon />}
          sx={{
            bgcolor: '#EC4899',
            borderRadius: '50px',
            px: 3,
            '&:hover': {
              bgcolor: '#D1366B',
            },
          }}
        >
          NEAR ME
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
