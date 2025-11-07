const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
const products = [
  { id: '1', name: 'Laptop', description: 'High-performance laptop', price: 999.99, stock: 50, category: 'Electronics', status: 'active', sku: 'LAP-001', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', name: 'Mouse', description: 'Wireless mouse', price: 29.99, stock: 100, category: 'Electronics', status: 'active', sku: 'MOU-001', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: '3', name: 'Keyboard', description: 'Mechanical keyboard', price: 79.99, stock: 75, category: 'Electronics', status: 'active', sku: 'KEY-001', createdAt: '2024-01-03', updatedAt: '2024-01-03' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v2',
      mode: MODE,
      service: 'product-service'
    }
  };
};

const getAllProducts = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const status = req.query.status;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    
    let filteredProducts = products;
    
    // Filter by category if provided
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    // Filter by status if provided
    if (status) {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }
    
    // Filter by price range if provided
    if (!isNaN(minPrice)) {
      filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
    }
    
    if (!isNaN(maxPrice)) {
      filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const response = addMetadata({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    });
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch products',
      message: error.message
    }));
  }
};

const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json(addMetadata({
        error: 'Product not found',
        productId: id
      }));
    }
    
    res.status(200).json(addMetadata({ product }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch product',
      message: error.message
    }));
  }
};

const createProduct = (req, res) => {
  try {
    const { name, description, price, stock, category, sku } = req.body;
    
    if (!name || !price || stock === undefined) {
      return res.status(400).json(addMetadata({
        error: 'Name, price, and stock are required'
      }));
    }
    
    if (price < 0 || stock < 0) {
      return res.status(400).json(addMetadata({
        error: 'Price and stock must be non-negative'
      }));
    }
    
    // Check if SKU already exists
    if (sku && products.some(p => p.sku === sku)) {
      return res.status(400).json(addMetadata({
        error: 'Product with this SKU already exists'
      }));
    }
    
    const now = new Date().toISOString().split('T')[0];
    const newProduct = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || 'General',
      status: 'active',
      sku: sku || `PRD-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    
    products.push(newProduct);
    
    res.status(201).json(addMetadata({ product: newProduct }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to create product',
      message: error.message
    }));
  }
};

const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Product not found',
        productId: id
      }));
    }
    
    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json(addMetadata({
        error: 'Price must be non-negative'
      }));
    }
    
    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json(addMetadata({
        error: 'Stock must be non-negative'
      }));
    }
    
    // Check SKU uniqueness if being updated
    if (updates.sku && products.some((p, idx) => p.sku === updates.sku && idx !== productIndex)) {
      return res.status(400).json(addMetadata({
        error: 'Product with this SKU already exists'
      }));
    }
    
    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      ...(updates.price && { price: parseFloat(updates.price) }),
      ...(updates.stock !== undefined && { stock: parseInt(updates.stock) }),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    products[productIndex] = updatedProduct;
    
    res.status(200).json(addMetadata({ product: updatedProduct }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to update product',
      message: error.message
    }));
  }
};

const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Product not found',
        productId: id
      }));
    }
    
    // Soft delete in v2 (set status to inactive)
    products[productIndex].status = 'inactive';
    products[productIndex].updatedAt = new Date().toISOString().split('T')[0];
    
    res.status(200).json(addMetadata({
      message: 'Product deleted successfully',
      productId: id
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to delete product',
      message: error.message
    }));
  }
};

const getProductsByCategory = (req, res) => {
  try {
    const { category } = req.params;
    const categoryProducts = products.filter(p => p.category === category && p.status === 'active');
    
    const response = addMetadata({
      category,
      products: categoryProducts,
      count: categoryProducts.length
    });
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to fetch products by category',
      message: error.message
    }));
  }
};

const updateStock = (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json(addMetadata({
        error: 'Valid quantity is required'
      }));
    }
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Product not found',
        productId: id
      }));
    }
    
    const product = products[productIndex];
    let newStock;
    
    switch (operation) {
      case 'add':
        newStock = product.stock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, product.stock - quantity);
        break;
      case 'set':
      default:
        newStock = quantity;
        break;
    }
    
    product.stock = newStock;
    product.updatedAt = new Date().toISOString().split('T')[0];
    products[productIndex] = product;
    
    res.status(200).json(addMetadata({
      message: 'Stock updated successfully',
      product: product
    }));
  } catch (error) {
    res.status(500).json(addMetadata({
      error: 'Failed to update stock',
      message: error.message
    }));
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  updateStock
};

