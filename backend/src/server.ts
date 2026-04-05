import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import musicRoutes from './routes/musicRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/music', musicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
