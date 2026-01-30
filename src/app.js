import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import esgRoutes from './routes/esgRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Create Express app
const app = express();

// ======================
// Security Middleware
// ======================

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// Enable CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
);

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // limit each IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// ======================
// Body Parser Middleware
// ======================

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// Logging Middleware (Development)
// ======================

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ======================
// Health Check Route
// ======================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ESG Management Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ======================
// API Routes
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/esg', esgRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// ======================
// Welcome Route
// ======================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ESG Management Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      esg: '/api/esg',
      reports: '/api/reports',
      users: '/api/users'
    }
  });
});

// ======================
// Error Handling
// ======================

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
