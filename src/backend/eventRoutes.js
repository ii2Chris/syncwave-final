import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();



router.get('/event', async (req, res) => {
    try {
      const { query } = req.query; // Get the search term from query parameters
      if (!process.env.TICKETMASTER_KEY) {
        throw new Error('Ticketmaster API key is missing.');
      }
  
      const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&dmaId=345&apikey=${process.env.TICKETMASTER_KEY}`;
      const searchUrl = query ? `${apiUrl}&keyword=${encodeURIComponent(query)}` : apiUrl;
  
      const response = await fetch(searchUrl);
  
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
      const events = data._embedded?.events || [];
      res.status(200).json({ events });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Failed to fetch events.' });
    }
  });
  
  export default router;
  