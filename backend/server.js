const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const sweetsRoutes = require('./routes/sweets');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const parseOrigins = () => {
  const fromEnv = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
  const list = fromEnv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (list.length > 0) return list;
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

app.use(cors({
  origin: (origin, callback) => {
    const allowed = parseOrigins();
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sweet Shop API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sweets', sweetsRoutes);
app.use('/api/inventory', inventoryRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Sweet Shop API v1.0.0',
    documentation: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get user profile (Protected)',
        'POST /api/auth/refresh': 'Refresh JWT token (Protected)'
      },
      sweets: {
        'GET /api/sweets': 'Get all sweets (Protected)',
        'GET /api/sweets/search': 'Search sweets (Protected)',
        'GET /api/sweets/categories': 'Get categories (Protected)',
        'GET /api/sweets/:id': 'Get sweet by ID (Protected)',
        'POST /api/sweets': 'Create sweet (Admin only)',
        'PUT /api/sweets/:id': 'Update sweet (Admin only)',
        'DELETE /api/sweets/:id': 'Delete sweet (Admin only)',
        'POST /api/sweets/:id/purchase': 'Purchase sweet (Protected)',
        'POST /api/sweets/:id/restock': 'Restock sweet (Admin only)'
      },
      inventory: {
        'GET /api/inventory/purchases': 'Get purchase history (Protected)',
        'GET /api/inventory/logs': 'Get inventory logs (Admin only)',
        'GET /api/inventory/logs/:id': 'Get logs for sweet (Admin only)',
        'GET /api/inventory/stats': 'Get inventory stats (Admin only)'
      }
    },
    authentication: 'Bearer token required for protected routes',
    adminCredentials: {
      email: process.env.ADMIN_EMAIL || 'admin@sweetshop.com',
      password: 'Check your .env file'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Sweet Shop API server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n👤 Admin Login:`);
        console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@sweetshop.com'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await database.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await database.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});


if (require.main === module) {
  startServer();
}

module.exports = app;
