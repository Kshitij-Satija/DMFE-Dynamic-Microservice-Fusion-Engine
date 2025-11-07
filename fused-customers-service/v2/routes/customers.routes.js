const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');

// GET /v2/customers - Get all customers (with pagination)
router.get('/customers', customersController.getAllCustomers);

// GET /v2/customers/:id - Get customer by ID
router.get('/customers/:id', customersController.getCustomerById);

// POST /v2/customers - Create new customer
router.post('/customers', customersController.createCustomer);

// PATCH /v2/customers/:id - Update customer (partial update)
router.patch('/customers/:id', customersController.updateCustomer);

// DELETE /v2/customers/:id - Delete customer
router.delete('/customers/:id', customersController.deleteCustomer);

// GET /v2/customers/:id/orders - Get customer orders (new in v2)
router.get('/customers/:id/orders', customersController.getCustomerOrders);

module.exports = router;

