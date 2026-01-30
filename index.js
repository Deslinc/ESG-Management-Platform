import 'dotenv/config';
import app from './src/app.js';
import connectDatabase from './src/config/database.js';

// ======================
// Configuration
// ======================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ======================
// Database Connection
// ======================

connectDatabase();

// ======================
// Start Server
// ======================

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('ESG Management Platform API');
  console.log('='.repeat(50));
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// ======================
// Graceful Shutdown
// ======================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);

  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n SIGINT received. Shutting down gracefully...');

  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
