import { spawn } from 'child_process';
import path from 'path';
import { MusicSearchResult, StreamDescriptor } from './musicTypes';
import logger from '../utils/logger';

// Path to the downloaded yt-dlp binary in the backend root
const ytDlpPath = path.resolve(__dirname, '../../yt-dlp');

const parseExpiryFromStreamUrl = (streamUrl: string): number => {
  try {
    const url = new URL(streamUrl);
    const expireParam = url.searchParams.get('expire');
    if (expireParam) {
      const expiresAt = Number(expireParam) * 1000;
      if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
        return expiresAt;
      }
    }
  } catch {
    // Ignore URL parsing errors and use fallback TTL.
  }

  return Date.now() + (30 * 60 * 1000);
};

export const searchYouTube = (query: string): Promise<MusicSearchResult[]> => {
  return new Promise((resolve, reject) => {
    logger.info(`Searching YouTube for: ${query}`);
    // Fast flags for yt-dlp search
    const ytDlp = spawn(ytDlpPath, [
      `ytsearch10:${query}`,
      '--dump-json',
      '--no-playlist',
      '--ignore-errors',
      '--no-warnings',
      '--no-check-certificates',
      '--no-call-home',
      '--no-cache-dir',
      '--flat-playlist'
    ]);

    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => { output += data.toString(); });
    ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });

    ytDlp.on('close', (code) => {
      if (code !== 0 && !output) {
        logger.error(`yt-dlp search error: ${errorOutput}`);
        return reject(new Error('Failed to search YouTube'));
      }

      const results = output
        .trim()
        .split('\n')
        .map((line) => {
          try { return JSON.parse(line); } 
          catch (e) { return null; }
        })
        .filter(Boolean);

      // Sort by view_count in descending order
      results.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

      const formattedResults: MusicSearchResult[] = results.map((v) => ({
        id: v.id,
        title: v.title,
        artist: v.uploader,
        duration: v.duration,
        thumbnail: v.thumbnail,
        url: v.webpage_url,
        viewCount: v.view_count || 0,
      }));

      resolve(formattedResults);
    });
  });
};

export const getAudioStreamDescriptor = (videoId: string): Promise<StreamDescriptor> => {
  return new Promise((resolve, reject) => {
    logger.info(`Extracting audio descriptor for video ID: ${videoId}`);
    const ytDlp = spawn(ytDlpPath, [
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--dump-single-json',
      `https://www.youtube.com/watch?v=${videoId}`,
      '--no-warnings',
      '--no-check-certificates',
      '--no-call-home',
      '--no-cache-dir'
    ]);

    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => { output += data.toString(); });
    ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });

    ytDlp.on('close', (code) => {
      if (code !== 0 || !output) {
        logger.error(`yt-dlp extract error: ${errorOutput}`);
        return reject(new Error('Failed to extract audio URL'));
      }

      try {
        const parsed = JSON.parse(output);
        const streamUrl =
          parsed.url ||
          parsed.requested_formats?.[0]?.url ||
          parsed.requested_downloads?.[0]?.url ||
          parsed.formats?.find((format: { url?: string; acodec?: string; vcodec?: string }) => format.url && format.acodec !== 'none' && format.vcodec === 'none')?.url;

        if (!streamUrl) {
          return reject(new Error('Failed to extract audio URL'));
        }

        resolve({
          url: streamUrl,
          httpHeaders: parsed.http_headers || {},
          expiresAt: parseExpiryFromStreamUrl(streamUrl),
        });
      } catch {
        return reject(new Error('Failed to parse audio descriptor'));
      }
    });
  });
};

export const getAudioStreamUrl = async (videoId: string): Promise<string> => {
  const descriptor = await getAudioStreamDescriptor(videoId);
  return descriptor.url;
};
