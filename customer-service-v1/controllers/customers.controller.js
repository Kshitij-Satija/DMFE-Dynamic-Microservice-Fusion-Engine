const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
// In production, this would be a database
const customers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', createdAt: '2024-01-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '123-456-7891', createdAt: '2024-01-02' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v1',
      mode: MODE,
      service: 'customer-service'
    }
  };
};

const getAllCustomers = (req, res) => {
  try {
    const response = addMetadata({
      customers: customers,
      count: customers.length
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch customers',
      message: error.message
    }));
  }
};

const getCustomerById = (req, res) => {
  try {
    const { id } = req.params;
    const customer = customers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json(addMetadata({
        error: 'Customer not found',
        customerId: id
      }));
    }
    
    res.status(200).json(addMetadata({ customer }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch customer',
      message: error.message
    }));
  }
};

const createCustomer = (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json(addMetadata({
        error: 'Name and email are required'
      }));
    }
    
    const newCustomer = {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    customers.push(newCustomer);
    
    res.status(201).json(addMetadata({ customer: newCustomer }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to create customer',
      message: error.message
    }));
  }
};

const updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Customer not found',
        customerId: id
      }));
    }
    
    const updatedCustomer = {
      ...customers[customerIndex],
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone })
    };
    
    customers[customerIndex] = updatedCustomer;
    
    res.status(200).json(addMetadata({ customer: updatedCustomer }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to update customer',
      message: error.message
    }));
  }
};

const deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Customer not found',
        customerId: id
      }));
    }
    
    customers.splice(customerIndex, 1);
    
    res.status(200).json(addMetadata({
      message: 'Customer deleted successfully',
      customerId: id
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to delete customer',
      message: error.message
    }));
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

