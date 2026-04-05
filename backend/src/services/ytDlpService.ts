import { spawn } from 'child_process';
import path from 'path';
import logger from '../utils/logger';

// Path to the downloaded yt-dlp binary in the backend root
const ytDlpPath = path.resolve(__dirname, '../../yt-dlp');

export const searchYouTube = (query: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    logger.info(`Searching YouTube for: ${query}`);
    const ytDlp = spawn(ytDlpPath, [
      `ytsearch5:${query}`,
      '--dump-json',
      '--no-playlist',
      '--ignore-errors',
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

      const formattedResults = results.map((v) => ({
        id: v.id,
        title: v.title,
        artist: v.uploader,
        duration: v.duration,
        thumbnail: v.thumbnail,
        url: v.webpage_url,
      }));

      resolve(formattedResults);
    });
  });
};

export const getAudioStreamUrl = (videoId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    logger.info(`Extracting audio URL for video ID: ${videoId}`);
    const ytDlp = spawn(ytDlpPath, [
      '-f',
      'bestaudio',
      '-g',
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    let url = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => { url += data.toString(); });
    ytDlp.stderr.on('data', (data) => { errorOutput += data.toString(); });

    ytDlp.on('close', (code) => {
      if (code !== 0 || !url) {
        logger.error(`yt-dlp extract error: ${errorOutput}`);
        return reject(new Error('Failed to extract audio URL'));
      }
      resolve(url.trim());
    });
  });
};
