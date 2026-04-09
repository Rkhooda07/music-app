"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const musicController_1 = require("../controllers/musicController");
const router = (0, express_1.Router)();
router.get('/search', musicController_1.searchMusic);
router.get('/url/:videoId', musicController_1.getStreamUrl);
router.get('/stream/:videoId', musicController_1.streamAudio);
exports.default = router;
