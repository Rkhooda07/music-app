import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import musicRoutes from './routes/musicRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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

app.listen(Number(PORT), HOST, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
});
