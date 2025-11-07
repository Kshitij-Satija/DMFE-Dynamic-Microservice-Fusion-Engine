const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products.routes');

const app = express();
const PORT = process.env.PORT || 5001;
const MODE = process.env.MODE || 'standalone';

// Middleware
app.use(cors());
app.use(express.json());

// Mount version-specific routes
app.use('/v1', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: 'v1',
    mode: MODE,
    service: 'product-service'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Product Service v1 running on port ${PORT} in ${MODE} mode`);
});

module.exports = app;

