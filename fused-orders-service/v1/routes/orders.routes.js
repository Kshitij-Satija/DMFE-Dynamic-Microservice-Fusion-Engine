const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

// GET /v1/orders - Get all orders
router.get('/orders', ordersController.getAllOrders);

// GET /v1/orders/:id - Get order by ID
router.get('/orders/:id', ordersController.getOrderById);

// POST /v1/orders - Create new order
router.post('/orders', ordersController.createOrder);

// PUT /v1/orders/:id - Update order
router.put('/orders/:id', ordersController.updateOrder);

// DELETE /v1/orders/:id - Delete order
router.delete('/orders/:id', ordersController.deleteOrder);

module.exports = router;

