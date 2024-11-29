import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button } from '@mui/material';
import PropTypes from 'prop-types'; // Import PropTypes


function EventCard({ event }) {
  return (
    <Card sx={{ maxWidth: 345, margin: 2 }}>
      {/* Display event image */}
      {event.images && event.images[0] && (
        <CardMedia
          component="img"
          height="140"
          image={event.images[0].url}
          alt={event.name}
        />
      )}

      <CardContent>
        {/* Display event name */}
        <Typography gutterBottom variant="h5" component="div">
          {event.name}
        </Typography>

        {/* Display event location */}
        <Typography variant="body2" color="text.secondary">
          {event._embedded && event._embedded.venues[0].name}, {event._embedded && event._embedded.venues[0].city.name}
        </Typography>

        {/* Display event date */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Date: {new Date(event.dates.start.dateTime).toLocaleDateString()}
        </Typography>

        {/* Link to event details */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Details
          </Button>
        </Box>
        {/*Button to enter matchmake poo*/}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            MatchMake
          </Button>
        </Box>
      
      </CardContent>
    </Card>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    images:PropTypes.string.isRequired,
    url:PropTypes.string.isRequired,
    dates:PropTypes.string.isRequired,


    // Define other properties based on the structure of 'event'
  }).isRequired,
};

export default EventCard;