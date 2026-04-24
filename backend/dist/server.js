"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const musicRoutes_1 = __importDefault(require("./routes/musicRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const streamService_1 = require("./services/streamService");
const backgroundUrlFetcher_1 = __importDefault(require("./services/backgroundUrlFetcher"));
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/music', musicRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling
app.use(errorHandler_1.errorHandler);
app.listen(Number(PORT), HOST, () => {
    logger_1.default.info(`Server is running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
    if (process.env.ENABLE_BACKGROUND_SYNC === 'true') {
        const intervalMs = Number(process.env.BACKGROUND_SYNC_INTERVAL_MS) || 5 * 60 * 1000;
        logger_1.default.info(`Background sync enabled: refreshing stream cache every ${intervalMs}ms`);
        setInterval(async () => {
            try {
                await (0, streamService_1.refreshSoonExpiringStreamCache)();
            }
            catch (error) {
                logger_1.default.warn(`Background sync failed: ${error instanceof Error ? error.message : 'unknown error'}`);
            }
        }, intervalMs);
    }
    if (process.env.ENABLE_BACKGROUND_URL_FETCHER === 'true') {
        const intervalMs = Number(process.env.BACKGROUND_URL_FETCH_INTERVAL_MS) || 5 * 60 * 1000;
        logger_1.default.info(`Background URL fetcher enabled: warming stream cache every ${intervalMs}ms`);
        void backgroundUrlFetcher_1.default.start();
        setInterval(() => {
            void backgroundUrlFetcher_1.default.start();
        }, intervalMs);
    }
});
