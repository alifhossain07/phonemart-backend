const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId, formatOrder } = require('../utils/helpers');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user orders (requires auth)
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { page = 1 } = req.query;
    const pageNum = parseInt(page) || 1;
    const perPage = 20;
    const skip = (pageNum - 1) * perPage;
    const limit = perPage;
    
    const orders = await db.collection('orders')
      .find({ user_id: toObjectId(req.userId) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('orders').countDocuments({ user_id: toObjectId(req.userId) });
    
    const formattedOrders = orders.map(order => formatOrder(order));
    
    return res.json({
      result: true,
      success: true,
      data: formattedOrders,
      pagination: {
        total,
        page: pageNum,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get user orders'
    });
  }
});

// Get user order by ID (requires auth)
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const order = await db.collection('orders').findOne({ 
      _id: toObjectId(id),
      user_id: toObjectId(req.userId) 
    });
    
    if (!order) {
      return res.status(404).json({
        result: false,
        message: 'Order not found'
      });
    }
    
    const formattedOrder = formatOrder(order);
    
    return res.json({
      result: true,
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error('Get user order error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get order details'
    });
  }
});

module.exports = router;

