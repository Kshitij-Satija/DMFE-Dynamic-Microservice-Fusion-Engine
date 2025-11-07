const express = require('express');
const cors = require('cors');
const customerRoutes = require('./routes/customers.routes');

const app = express();
const PORT = process.env.PORT || 3002;
const MODE = process.env.MODE || 'standalone';

// Middleware
app.use(cors());
app.use(express.json());

// Mount version-specific routes
app.use('/v2', customerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: 'v2',
    mode: MODE,
    service: 'customer-service'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Customer Service v2 running on port ${PORT} in ${MODE} mode`);
});

module.exports = app;

