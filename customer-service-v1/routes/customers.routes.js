const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');

// GET /v1/customers - Get all customers
router.get('/customers', customersController.getAllCustomers);

// GET /v1/customers/:id - Get customer by ID
router.get('/customers/:id', customersController.getCustomerById);

// POST /v1/customers - Create new customer
router.post('/customers', customersController.createCustomer);

// PUT /v1/customers/:id - Update customer
router.put('/customers/:id', customersController.updateCustomer);

// DELETE /v1/customers/:id - Delete customer
router.delete('/customers/:id', customersController.deleteCustomer);

module.exports = router;

