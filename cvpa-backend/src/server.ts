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
    
    // Allow requests with matching origin, or if no origin (same-origin requests)
    if (!requestOrigin || requestOrigin === allowedOrigin) {
      // Return the actual request origin (or allowed origin) to set the header correctly
      callback(null, origin || allowedOrigin || true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companiesRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
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
