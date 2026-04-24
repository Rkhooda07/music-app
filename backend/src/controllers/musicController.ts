import { NextFunction, Request, Response } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { MusicSearchResult } from '../services/musicTypes';
import { resolveStreamDescriptor, warmTopSearchResults } from '../services/streamService';
import { YouTubeDataApiError, searchYouTubeWithDataApi } from '../services/youtubeDataApiService';
import { getAudioStreamDescriptor, listFormats as listYtDlpFormats, searchYouTube } from '../services/ytDlpService';
import logger from '../utils/logger';

interface SearchCacheEntry {
  data?: MusicSearchResult[];
  expiresAt?: number;
  pendingPromise?: Promise<MusicSearchResult[]>;
}

const searchQueryCache = new Map<string, SearchCacheEntry>();
const SEARCH_TTL = 24 * 60 * 60 * 1000; // 24 hours

const isFreshSearchEntry = (entry?: SearchCacheEntry): entry is SearchCacheEntry & { data: MusicSearchResult[]; expiresAt: number } => {
  return Boolean(entry?.data && entry.expiresAt && entry.expiresAt > Date.now());
};

const shouldFallbackToYtDlp = (error: unknown) => {
  return error instanceof YouTubeDataApiError && error.shouldFallbackToYtDlp;
};

const loadSearchResults = async (query: string) => {
  try {
    return await searchYouTubeWithDataApi(query);
  } catch (error) {
    if (!shouldFallbackToYtDlp(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'unknown error';
    logger.warn(`Falling back to yt-dlp search for "${query}": ${message}`);
    return searchYouTube(query);
  }
};

export const searchMusic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const query = q.trim().toLowerCase();
    const cachedSearch = searchQueryCache.get(query);
    if (isFreshSearchEntry(cachedSearch)) {
      logger.info(`Search cache hit: ${query}`);
      res.json({ data: cachedSearch.data });
      warmTopSearchResults(cachedSearch.data);
      return;
    }

    const pendingPromise = cachedSearch?.pendingPromise || loadSearchResults(query);
    searchQueryCache.set(query, { ...cachedSearch, pendingPromise });

    const results = await pendingPromise;
    searchQueryCache.set(query, {
      data: results,
      expiresAt: Date.now() + SEARCH_TTL,
    });

    res.json({ data: results });
    warmTopSearchResults(results);

  } catch (error) {
    searchQueryCache.delete(String(req.query.q || '').trim().toLowerCase());
    next(error);
  }
};

export const getStreamUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const quality = req.query.quality === 'low' ? 'low' : 'best';
    const streamDescriptor = quality === 'low'
      ? await getAudioStreamDescriptor(videoId, 'low')
      : await resolveStreamDescriptor(videoId, 'play');

    res.json({ url: streamDescriptor.url });
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

    const quality = req.query.quality === 'low' ? 'low' : 'best';
    const streamDescriptor = quality === 'low'
      ? await getAudioStreamDescriptor(videoId, 'low')
      : await resolveStreamDescriptor(videoId, 'play');
    const abortController = new AbortController();
    const forwardedHeaders: Record<string, string> = {
      ...streamDescriptor.httpHeaders,
    };
    const range = req.headers.range;
    const ifRange = req.headers['if-range'];

    if (typeof range === 'string') {
      forwardedHeaders.Range = range;
    }

    if (typeof ifRange === 'string') {
      forwardedHeaders['If-Range'] = ifRange;
    }

    const closeHandler = () => {
      abortController.abort();
    };

    req.on('close', closeHandler);

    try {
      const upstreamResponse = await fetch(streamDescriptor.url, {
        headers: forwardedHeaders,
        signal: abortController.signal,
      });

      const responseHeaders = [
        'accept-ranges',
        'cache-control',
        'content-length',
        'content-range',
        'content-type',
        'etag',
        'last-modified',
      ];

      responseHeaders.forEach((headerName) => {
        const headerValue = upstreamResponse.headers.get(headerName);
        if (headerValue) {
          res.setHeader(headerName, headerValue);
        }
      });

      res.status(upstreamResponse.status);

      if (!upstreamResponse.body) {
        res.end();
        return;
      }

      const bodyStream = Readable.fromWeb(upstreamResponse.body as any);
      try {
        await pipeline(bodyStream, res);
      } catch (pipelineError) {
        if (
          pipelineError instanceof Error &&
          (pipelineError.name === 'AbortError' || pipelineError.message.includes('Premature close'))
        ) {
          return;
        }

        if (res.headersSent || req.aborted || res.writableEnded) {
          return;
        }

        throw pipelineError;
      }
    } finally {
      req.off('close', closeHandler);
    }

  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Premature close'))
    ) {
      return;
    }

    if (res.headersSent || req.aborted || res.writableEnded) {
      return;
    }

    next(error);
  }
};

export const listFormats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const formats = await listYtDlpFormats(videoId);
    res.type('text/plain').send(formats);
  } catch (error) {
    next(error);
  }
};
