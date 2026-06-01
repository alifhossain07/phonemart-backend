const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId, formatProduct } = require('../utils/helpers');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user wishlist (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    
    const wishlist = await db.collection('wishlists').findOne({ 
      user_id: toObjectId(req.userId) 
    });
    
    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return res.json({
        result: true,
        success: true,
        data: []
      });
    }
    
    // Get full product details
    const productIds = wishlist.products.map(p => toObjectId(p));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds }, published: true })
      .toArray();
    
    const formattedProducts = products.map(p => formatProduct(p));
    
    return res.json({
      result: true,
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get wishlist'
    });
  }
});

// Add product to wishlist (requires auth)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        result: false,
        message: 'Product ID is required'
      });
    }
    
    const db = getDB();
    const userId = toObjectId(req.userId);
    const productId = toObjectId(product_id);
    
    // Verify product exists
    const product = await db.collection('products').findOne({ _id: productId, published: true });
    if (!product) {
      return res.status(404).json({
        result: false,
        message: 'Product not found'
      });
    }
    
    // Add to wishlist (upsert)
    await db.collection('wishlists').updateOne(
      { user_id: userId },
      { 
        $addToSet: { products: productId },
        $set: { updated_at: new Date() },
        $setOnInsert: { user_id: userId, created_at: new Date() }
      },
      { upsert: true }
    );
    
    return res.json({
      result: true,
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to add product to wishlist'
    });
  }
});

// Remove product from wishlist (requires auth)
router.post('/remove', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        result: false,
        message: 'Product ID is required'
      });
    }
    
    const db = getDB();
    const userId = toObjectId(req.userId);
    const productId = toObjectId(product_id);
    
    await db.collection('wishlists').updateOne(
      { user_id: userId },
      { 
        $pull: { products: productId },
        $set: { updated_at: new Date() }
      }
    );
    
    return res.json({
      result: true,
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to remove product from wishlist'
    });
  }
});

// Check if product is in wishlist (requires auth)
router.get('/check/:product_id', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.params;
    const db = getDB();
    const userId = toObjectId(req.userId);
    const productId = toObjectId(product_id);
    
    const wishlist = await db.collection('wishlists').findOne({ 
      user_id: userId,
      products: productId
    });
    
    return res.json({
      result: true,
      success: true,
      data: {
        in_wishlist: !!wishlist
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to check wishlist'
    });
  }
});

module.exports = router;

