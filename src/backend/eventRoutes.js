import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

/**
 * @route GET /events/nearby
 * @description Get events near a specified location using Ticketmaster API
 * @access Private - Requires valid JWT token
 * 
 * @queryParam {number} latitude - Location latitude
 * @queryParam {number} longitude - Location longitude
 * @queryParam {number} [radius=50] - Search radius in miles
 * 
 * @returns {Object} 200 - List of nearby events
 * @returns {Object} 400 - Missing coordinates
 * @returns {Object} 500 - Server or API error
 */
router.get('/events/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query;

        // Log request parameters for debugging
        console.log('Received params:', { latitude, longitude, radius });

        // Validate required parameters
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Latitude and longitude are required' 
            });
        }

        // Verify API key availability
        if (!process.env.TICKETMASTER_KEY) {
            throw new Error('Ticketmaster API key is missing');
        }

        // Construct API URL with parameters
        const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_KEY}&latlong=${latitude},${longitude}&radius=${radius}&unit=miles&classificationName=music&size=20&sort=distance,date,asc`;
        
        console.log('Fetching events from:', apiUrl);

        // Make API request
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Handle API errors
        if (!response.ok) {
            console.error('Ticketmaster API error:', data);
            throw new Error(`Ticketmaster API error: ${response.status} - ${data.error || 'Unknown error'}`);
        }

        // Log response structure for debugging
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

/**
 * @route GET /event/search
 * @description Search for events by keyword and country using Ticketmaster API
 * @access Private - Requires valid JWT token
 * 
 * @queryParam {string} query - Search keyword
 * @queryParam {string} [countryCode=US] - Two-letter country code
 * 
 * @returns {Object} 200 - List of matching events
 * @returns {Object} 400 - Missing search query
 * @returns {Object} 500 - Server or API error
 */
router.get('/event/search', async (req, res) => {
    try {
      const { query, countryCode = 'US' } = req.query;

      // Validate required parameters
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Verify API key availability
      if (!process.env.TICKETMASTER_KEY) {
        throw new Error('Ticketmaster API key is missing.');
      }
  
      // Construct API URL with parameters
      const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(query)}&source=universe&countryCode=${countryCode}&apikey=${process.env.TICKETMASTER_KEY}`;
      
      console.log('Search API URL:', apiUrl);
      
      // Make API request
      const response = await fetch(apiUrl);
  
      // Handle API errors
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
  