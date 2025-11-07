const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
// In production, this would be a database
const customers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St', createdAt: '2024-01-01', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '123-456-7891', address: '456 Oak Ave', createdAt: '2024-01-02', status: 'active' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v2',
      mode: MODE,
      service: 'customer-service'
    }
  };
};

const getAllCustomers = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    let filteredCustomers = customers;
    
    // Filter by status if provided
    if (status) {
      filteredCustomers = customers.filter(c => c.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    const response = addMetadata({
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / limit)
      }
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
    const { name, email, phone, address } = req.body;
    
    if (!name || !email) {
      return res.status(400).json(addMetadata({
        error: 'Name and email are required'
      }));
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(addMetadata({
        error: 'Invalid email format'
      }));
    }
    
    const newCustomer = {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      address: address || '',
      status: 'active',
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
    const updates = req.body;
    
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Customer not found',
        customerId: id
      }));
    }
    
    // Validate email if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json(addMetadata({
          error: 'Invalid email format'
        }));
      }
    }
    
    const updatedCustomer = {
      ...customers[customerIndex],
      ...updates
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
    
    // Soft delete in v2 (set status to deleted)
    customers[customerIndex].status = 'deleted';
    
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

const getCustomerOrders = (req, res) => {
  try {
    const { id } = req.params;
    const customer = customers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json(addMetadata({
        error: 'Customer not found',
        customerId: id
      }));
    }
    
    // In a real scenario, this would fetch from order service
    // For now, return mock data
    const mockOrders = [
      { id: 'o1', customerId: id, total: 99.99, status: 'completed' },
      { id: 'o2', customerId: id, total: 149.99, status: 'pending' }
    ];
    
    res.status(200).json(addMetadata({
      customerId: id,
      orders: mockOrders,
      orderCount: mockOrders.length
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch customer orders',
      message: error.message
    }));
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders
};

