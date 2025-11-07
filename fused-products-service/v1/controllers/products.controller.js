const { v4: uuidv4 } = require('uuid');

const MODE = process.env.MODE || 'standalone';

// In-memory storage (stateless per request, no global state)
const products = [
  { id: '1', name: 'Laptop', description: 'High-performance laptop', price: 999.99, stock: 50, category: 'Electronics', createdAt: '2024-01-01' },
  { id: '2', name: 'Mouse', description: 'Wireless mouse', price: 29.99, stock: 100, category: 'Electronics', createdAt: '2024-01-02' },
  { id: '3', name: 'Keyboard', description: 'Mechanical keyboard', price: 79.99, stock: 75, category: 'Electronics', createdAt: '2024-01-03' }
];

// Helper function to add metadata to response
const addMetadata = (data) => {
  return {
    ...data,
    metadata: {
      version: 'v1',
      mode: MODE,
      service: 'product-service'
    }
  };
};

const getAllProducts = (req, res) => {
  try {
    const response = addMetadata({
      products: products,
      count: products.length
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
    const { name, description, price, stock, category } = req.body;
    
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
    
    const newProduct = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || 'General',
      createdAt: new Date().toISOString().split('T')[0]
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
    const { name, description, price, stock, category } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json(addMetadata({
        error: 'Product not found',
        productId: id
      }));
    }
    
    if (price !== undefined && price < 0) {
      return res.status(400).json(addMetadata({
        error: 'Price must be non-negative'
      }));
    }
    
    if (stock !== undefined && stock < 0) {
      return res.status(400).json(addMetadata({
        error: 'Stock must be non-negative'
      }));
    }
    
    const updatedProduct = {
      ...products[productIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(category && { category })
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
    
    products.splice(productIndex, 1);
    
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

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

