const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

// GET /v2/orders - Get all orders (with filters and pagination)
router.get('/orders', ordersController.getAllOrders);

// GET /v2/orders/:id - Get order by ID
router.get('/orders/:id', ordersController.getOrderById);

// POST /v2/orders - Create new order
router.post('/orders', ordersController.createOrder);

// PATCH /v2/orders/:id - Update order (partial update)
router.patch('/orders/:id', ordersController.updateOrder);

// DELETE /v2/orders/:id - Delete order
router.delete('/orders/:id', ordersController.deleteOrder);

// GET /v2/orders/customer/:customerId - Get orders by customer (new in v2)
router.get('/orders/customer/:customerId', ordersController.getOrdersByCustomer);

// POST /v2/orders/:id/cancel - Cancel order (new in v2)
router.post('/orders/:id/cancel', ordersController.cancelOrder);

module.exports = router;

