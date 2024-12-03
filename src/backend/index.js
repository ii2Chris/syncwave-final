import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import uploadRoutes from './uploadRoutes.js';

dotenv.config();

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Use routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/matches', matchRoutes);
app.use('/upload',uploadRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
