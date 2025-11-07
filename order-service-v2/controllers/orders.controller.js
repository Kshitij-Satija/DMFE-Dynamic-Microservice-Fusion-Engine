const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
const orders = [
  { id: '1', customerId: '1', items: [{ productId: '1', quantity: 2, price: 29.99, name: 'Product 1' }], total: 59.98, status: 'pending', shippingAddress: '123 Main St', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', customerId: '2', items: [{ productId: '2', quantity: 1, price: 49.99, name: 'Product 2' }], total: 49.99, status: 'completed', shippingAddress: '456 Oak Ave', createdAt: '2024-01-02', updatedAt: '2024-01-02' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v2',
      mode: MODE,
      service: 'order-service'
    }
  };
};

const getAllOrders = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const customerId = req.query.customerId;
    
    let filteredOrders = orders;
    
    // Filter by status if provided
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }
    
    // Filter by customerId if provided
    if (customerId) {
      filteredOrders = filteredOrders.filter(o => o.customerId === customerId);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    const response = addMetadata({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      }
    });
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch orders',
      message: error.message
    }));
  }
};

const getOrderById = (req, res) => {
  try {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      return res.status(404).json(addMetadata({
        error: 'Order not found',
        orderId: id
      }));
    }
    
    res.status(200).json(addMetadata({ order }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch order',
      message: error.message
    }));
  }
};

const createOrder = (req, res) => {
  try {
    const { customerId, items, shippingAddress } = req.body;
    
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(addMetadata({
        error: 'Customer ID, items array, and shipping address are required'
      }));
    }
    
    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json(addMetadata({
          error: 'Each item must have productId, quantity, and price'
        }));
      }
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const now = new Date().toISOString().split('T')[0];
    const newOrder = {
      id: uuidv4(),
      customerId,
      items,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      shippingAddress: shippingAddress || '',
      createdAt: now,
      updatedAt: now
    };
    
    orders.push(newOrder);
    
    res.status(201).json(addMetadata({ order: newOrder }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to create order',
      message: error.message
    }));
  }
};

const updateOrder = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Order not found',
        orderId: id
      }));
    }
    
    const updatedOrder = {
      ...orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    // Recalculate total if items changed
    if (updates.items) {
      updatedOrder.total = updates.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }
    
    orders[orderIndex] = updatedOrder;
    
    res.status(200).json(addMetadata({ order: updatedOrder }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to update order',
      message: error.message
    }));
  }
};

const deleteOrder = (req, res) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Order not found',
        orderId: id
      }));
    }
    
    // Soft delete in v2 (set status to cancelled)
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].updatedAt = new Date().toISOString().split('T')[0];
    
    res.status(200).json(addMetadata({
      message: 'Order cancelled successfully',
      orderId: id
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to delete order',
      message: error.message
    }));
  }
};

const getOrdersByCustomer = (req, res) => {
  try {
    const { customerId } = req.params;
    const customerOrders = orders.filter(o => o.customerId === customerId);
    
    const response = addMetadata({
      customerId,
      orders: customerOrders,
      count: customerOrders.length
    });
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch customer orders',
      message: error.message
    }));
  }
};

const cancelOrder = (req, res) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Order not found',
        orderId: id
      }));
    }
    
    const order = orders[orderIndex];
    
    if (order.status === 'completed') {
      return res.status(400).json(addMetadata({
        error: 'Cannot cancel a completed order',
        orderId: id
      }));
    }
    
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString().split('T')[0];
    orders[orderIndex] = order;
    
    res.status(200).json(addMetadata({
      message: 'Order cancelled successfully',
      order: order
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to cancel order',
      message: error.message
    }));
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByCustomer,
  cancelOrder
};

