import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get events near a location
router.get('/events/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query;

        // Log the received parameters
        console.log('Received params:', { latitude, longitude, radius });

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Latitude and longitude are required' 
            });
        }

        if (!process.env.TICKETMASTER_KEY) {
            throw new Error('Ticketmaster API key is missing');
        }

        const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_KEY}&latlong=${latitude},${longitude}&radius=${radius}&unit=miles&classificationName=music&size=20&sort=distance,date,asc`;
        
        console.log('Fetching events from:', apiUrl);

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            console.error('Ticketmaster API error:', data);
            throw new Error(`Ticketmaster API error: ${response.status} - ${data.error || 'Unknown error'}`);
        }

        // Log the response structure
        console.log('Ticketmaster response structure:', {
            hasEmbedded: !!data._embedded,
            hasEvents: !!(data._embedded && data._embedded.events),
            eventCount: data._embedded?.events?.length || 0
        });
        
        res.status(200).json(data);

    } catch (error) {
        console.error('Detailed error in /events/nearby:', error);
        res.status(500).json({ 
            error: 'Failed to fetch events.',
            details: error.message 
        });
    }
});

// Original search endpoint remains unchanged
router.get('/event/search', async (req, res) => {
    try {
      const { query, countryCode = 'US' } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      if (!process.env.TICKETMASTER_KEY) {
        throw new Error('Ticketmaster API key is missing.');
      }
  
      const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(query)}&source=universe&countryCode=${countryCode}&apikey=${process.env.TICKETMASTER_KEY}`;
      
      console.log('Search API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
  
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Search Response:', data);
      res.status(200).json(data);
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ error: 'Failed to search events.' });
    }
});

export default router;
  