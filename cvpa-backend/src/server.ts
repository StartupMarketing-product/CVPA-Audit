import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import companiesRoutes from './routes/companies.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Normalize origins by removing trailing slashes
    const normalize = (url: string | undefined) => url ? url.replace(/\/$/, '') : undefined;
    const allowedOrigin = normalize(process.env.CORS_ORIGIN || 'http://localhost:3000');
    const requestOrigin = normalize(origin);
    
    // #region agent log
    console.log(`[DEBUG] CORS check: requestOrigin=${requestOrigin}, allowedOrigin=${allowedOrigin}`);
    // #endregion
    
    // Allow requests with matching origin, or if no origin (same-origin requests)
    if (!requestOrigin || requestOrigin === allowedOrigin) {
      // Return the actual request origin (or allowed origin) to set the header correctly
      callback(null, origin || allowedOrigin || true);
    } else {
      // #region agent log
      console.log(`[DEBUG] CORS rejected: requestOrigin=${requestOrigin} not matching allowedOrigin=${allowedOrigin}`);
      // #endregion
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Request logging middleware (before routes)
app.use((req, res, next) => {
  // #region agent log
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.path} from origin=${req.headers.origin}`);
  // #endregion
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companiesRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the server keep running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log but don't exit for non-critical errors
});

// Initialize and start server
async function start() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

