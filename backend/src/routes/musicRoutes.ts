import { Router } from 'express';
import {
  searchMusic,
  getStreamUrl,
  listFormats,
  streamAudio,
  cachePlaylist,
  cachePlaylistTrackHandler,
} from '../controllers/musicController';

const router = Router();

router.get('/search', searchMusic);
router.get('/url/:videoId', getStreamUrl);
router.get('/formats/:videoId', listFormats);
router.get('/stream/:videoId', streamAudio);
router.post('/cache/playlist/:playlistId', cachePlaylist);
router.post('/cache/playlist/:playlistId/track', cachePlaylistTrackHandler);

export default router;
