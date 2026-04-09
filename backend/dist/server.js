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
});
