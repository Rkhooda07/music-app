import { Request, Response, NextFunction } from 'express';
import { searchYouTube, getAudioStreamUrl } from '../services/ytDlpService';
import logger from '../utils/logger';
import ffmpeg from 'fluent-ffmpeg';

export const searchMusic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await searchYouTube(q);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
};

export const getStreamUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const streamUrl = await getAudioStreamUrl(videoId);
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

    logger.info(`Streaming audio for video: ${videoId}`);
    const streamUrl = await getAudioStreamUrl(videoId);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    const command = ffmpeg(streamUrl)
      .noVideo()
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('error', (err: Error) => {
        logger.error(`ffmpeg error: ${err.message}`);
        // Connection resets are normal when mobile app skips/closes connection
      });

    command.pipe(res, { end: true });

    req.on('close', () => {
      command.kill('SIGKILL');
    });

  } catch (error) {
    next(error);
  }
};
