const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');

// GET /v1/products - Get all products
router.get('/products', productsController.getAllProducts);

// GET /v1/products/:id - Get product by ID
router.get('/products/:id', productsController.getProductById);

// POST /v1/products - Create new product
router.post('/products', productsController.createProduct);

// PUT /v1/products/:id - Update product
router.put('/products/:id', productsController.updateProduct);

// DELETE /v1/products/:id - Delete product
router.delete('/products/:id', productsController.deleteProduct);

module.exports = router;

