import { Router } from 'express';
import { searchMusic, getStreamUrl, streamAudio } from '../controllers/musicController';

const router = Router();

router.get('/search', searchMusic);
router.get('/url/:videoId', getStreamUrl);
router.get('/stream/:videoId', streamAudio);

export default router;
