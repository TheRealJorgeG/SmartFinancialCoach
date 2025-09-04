const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const subscriptionRoutes = require('./routes/subscriptionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

// Import database initialization
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Smart Financial Coach API'
  });
});

// API Routes
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
