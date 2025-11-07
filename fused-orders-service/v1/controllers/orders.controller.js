const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
const orders = [
  { id: '1', customerId: '1', items: [{ productId: '1', quantity: 2, price: 29.99 }], total: 59.98, status: 'pending', createdAt: '2024-01-01' },
  { id: '2', customerId: '2', items: [{ productId: '2', quantity: 1, price: 49.99 }], total: 49.99, status: 'completed', createdAt: '2024-01-02' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v1',
      mode: MODE,
      service: 'order-service'
    }
  };
};

const getAllOrders = (req, res) => {
  try {
    const response = addMetadata({
      orders: orders,
      count: orders.length
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
    const { customerId, items } = req.body;
    
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(addMetadata({
        error: 'Customer ID and items array are required'
      }));
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const newOrder = {
      id: uuidv4(),
      customerId,
      items,
      total: parseFloat(total.toFixed(2)),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
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
    const { status, items } = req.body;
    
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Order not found',
        orderId: id
      }));
    }
    
    const updatedOrder = {
      ...orders[orderIndex],
      ...(status && { status }),
      ...(items && { items })
    };
    
    // Recalculate total if items changed
    if (items) {
      updatedOrder.total = items.reduce((sum, item) => {
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
    
    orders.splice(orderIndex, 1);
    
    res.status(200).json(addMetadata({
      message: 'Order deleted successfully',
      orderId: id
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to delete order',
      message: error.message
    }));
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};

