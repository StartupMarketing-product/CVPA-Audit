"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const companies_routes_1 = __importDefault(require("./routes/companies.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Normalize origins by removing trailing slashes
        const normalize = (url) => url ? url.replace(/\/$/, '') : undefined;
        const allowedOrigin = normalize(process.env.CORS_ORIGIN || 'http://localhost:3000');
        const requestOrigin = normalize(origin);
        // Allow requests with matching origin, or if no origin (same-origin requests)
        if (!requestOrigin || requestOrigin === allowedOrigin) {
            // Return the actual request origin (or allowed origin) to set the header correctly
            callback(null, origin || allowedOrigin || true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CVPA Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/v1/auth',
            companies: '/api/v1/companies'
        }
    });
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/companies', companies_routes_1.default);
// Error handling
app.use((err, req, res, next) => {
    // #region agent log
    console.error(`[DEBUG] Error handler: method=${req.method}, path=${req.path}, error=${err.message}`, err.stack);
    // #endregion
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
// 404 handler
app.use((req, res) => {
    // #region agent log
    console.log(`[DEBUG] 404 handler: method=${req.method}, path=${req.path}, originalUrl=${req.originalUrl}`);
    // #endregion
    res.status(404).json({ error: 'Route not found' });
});
// Initialize and start server
async function start() {
    try {
        await (0, database_1.initializeDatabase)();
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map