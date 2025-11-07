const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');

// GET /v2/products - Get all products (with filters and pagination)
router.get('/products', productsController.getAllProducts);

// GET /v2/products/:id - Get product by ID
router.get('/products/:id', productsController.getProductById);

// POST /v2/products - Create new product
router.post('/products', productsController.createProduct);

// PATCH /v2/products/:id - Update product (partial update)
router.patch('/products/:id', productsController.updateProduct);

// DELETE /v2/products/:id - Delete product
router.delete('/products/:id', productsController.deleteProduct);

// GET /v2/products/category/:category - Get products by category (new in v2)
router.get('/products/category/:category', productsController.getProductsByCategory);

// POST /v2/products/:id/stock - Update stock (new in v2)
router.post('/products/:id/stock', productsController.updateStock);

module.exports = router;

