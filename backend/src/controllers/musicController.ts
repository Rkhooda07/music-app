import { Request, Response, NextFunction } from 'express';
import { searchYouTube, getAudioStreamUrl } from '../services/ytDlpService';
import logger from '../utils/logger';

// In-memory caches
const searchQueryCache = new Map<string, { data: any[]; timestamp: number }>();
const streamCache = new Map<string, { url: string; timestamp: number }>();

const SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STREAM_TTL = 30 * 60 * 1000; // 30 minutes

export const searchMusic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const query = q.trim().toLowerCase();

    // 1. Check Search Cache (Instant hit)
    const cachedSearch = searchQueryCache.get(query);
    if (cachedSearch && Date.now() - cachedSearch.timestamp < SEARCH_TTL) {
      logger.info(`Search cache hit: ${query}`);
      // Immediately return cached results
      res.json({ data: cachedSearch.data });
      
      // Still pre-warm top 3 results in the background in case streamCache expired
      preWarmTracks(cachedSearch.data.slice(0, 3));
      return;
    }

    // 2. Perform fresh search
    const results = await searchYouTube(query);
    searchQueryCache.set(query, { data: results, timestamp: Date.now() });
    
    // Return to user immediately
    res.json({ data: results });

    // 3. BACKGROUND PRE-WARMING (The "Spotify" trick)
    // While the user is browsing results, we secretly fetch the stream URLs 
    // for the top 3 results so they are ready when the user clicks 'Play'.
    preWarmTracks(results.slice(0, 3));

  } catch (error) {
    next(error);
  }
};

/**
 * Background worker to pre-extract stream URLs
 */
const preWarmTracks = (tracks: any[]) => {
    tracks.forEach(track => {
        const videoId = track.id;
        if (!streamCache.has(videoId) || Date.now() - streamCache.get(videoId)!.timestamp > STREAM_TTL) {
            getAudioStreamUrl(videoId)
                .then(url => {
                    logger.info(`Pre-warmed track: ${videoId}`);
                    streamCache.set(videoId, { url, timestamp: Date.now() });
                })
                .catch(() => { /* Silent failure for pre-warming */ });
        }
    });
};

export const getStreamUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Check Stream Cache
    const cached = streamCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < STREAM_TTL) {
      return res.json({ url: cached.url });
    }

    const streamUrl = await getAudioStreamUrl(videoId);
    streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
    
    res.json({ url: streamUrl });
  } catch (error) {
    next(error);
  }
};

export const streamAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    let streamUrl: string;

    // Check Stream Cache
    const cached = streamCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < STREAM_TTL) {
      streamUrl = cached.url;
    } else {
      logger.info(`Extracting audio for stream: ${videoId} (cache miss)`);
      streamUrl = await getAudioStreamUrl(videoId);
      streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
    }

    // Low-latency redirect
    res.redirect(streamUrl);

  } catch (error) {
    next(error);
  }
};
