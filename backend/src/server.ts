import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import musicRoutes from './routes/musicRoutes';
import { errorHandler } from './middleware/errorHandler';
import { refreshSoonExpiringStreamCache } from './services/streamService';
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

  if (process.env.ENABLE_BACKGROUND_SYNC === 'true') {
    const intervalMs = Number(process.env.BACKGROUND_SYNC_INTERVAL_MS) || 5 * 60 * 1000;
    logger.info(`Background sync enabled: refreshing stream cache every ${intervalMs}ms`);
    setInterval(async () => {
      try {
        await refreshSoonExpiringStreamCache();
      } catch (error) {
        logger.warn(`Background sync failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }, intervalMs);
  }
});
