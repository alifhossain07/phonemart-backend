const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId, paginate, buildPaginationMeta } = require('../utils/helpers');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's warranty claims (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { page, status } = req.query;
    const { skip, limit, page: pageNum, perPage } = paginate(page, '20');
    
    let query = { user_id: toObjectId(req.userId) };
    
    if (status) {
      query.status = status;
    }
    
    const warranties = await db.collection('warranty_claims')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('warranty_claims').countDocuments(query);
    
    // Populate product and order information
    const warrantiesWithDetails = await Promise.all(warranties.map(async (warranty) => {
      const product = await db.collection('products').findOne({ _id: toObjectId(warranty.product_id) });
      const order = await db.collection('orders').findOne({ _id: toObjectId(warranty.order_id) });
      
      // Calculate days in warranty
      const daysInWarranty = Math.floor((new Date() - new Date(warranty.created_at)) / (1000 * 60 * 60 * 24));
      
      // Calculate estimated return date
      let estimatedReturnDate = null;
      if (warranty.estimated_days) {
        const returnDate = new Date(warranty.created_at);
        returnDate.setDate(returnDate.getDate() + warranty.estimated_days);
        estimatedReturnDate = returnDate;
      }
      
      return {
        id: warranty._id.toString(),
        order_code: order?.order_code || 'N/A',
        product_name: product?.name || 'Product not found',
        product_image: product?.thumbnail_image || null,
        issue_description: warranty.issue_description,
        status: warranty.status,
        days_in_warranty: daysInWarranty,
        estimated_days: warranty.estimated_days || null,
        estimated_return_date: estimatedReturnDate,
        admin_notes: warranty.admin_notes || null,
        created_at: warranty.created_at,
        updated_at: warranty.updated_at
      };
    }));
    
    return res.json({
      result: true,
      success: true,
      data: warrantiesWithDetails,
      pagination: {
        total,
        page: pageNum,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    console.error('Get warranties error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get warranty claims'
    });
  }
});

// Get single warranty claim
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const warranty = await db.collection('warranty_claims').findOne({ 
      _id: toObjectId(id),
      user_id: toObjectId(req.userId)
    });
    
    if (!warranty) {
      return res.status(404).json({
        result: false,
        message: 'Warranty claim not found'
      });
    }
    
    const product = await db.collection('products').findOne({ _id: toObjectId(warranty.product_id) });
    const order = await db.collection('orders').findOne({ _id: toObjectId(warranty.order_id) });
    
    // Calculate days in warranty
    const daysInWarranty = Math.floor((new Date() - new Date(warranty.created_at)) / (1000 * 60 * 60 * 24));
    
    // Calculate estimated return date
    let estimatedReturnDate = null;
    if (warranty.estimated_days) {
      const returnDate = new Date(warranty.created_at);
      returnDate.setDate(returnDate.getDate() + warranty.estimated_days);
      estimatedReturnDate = returnDate;
    }
    
    return res.json({
      result: true,
      success: true,
      data: {
        id: warranty._id.toString(),
        order_id: warranty.order_id.toString(),
        order_code: order?.order_code || 'N/A',
        product_id: warranty.product_id.toString(),
        product_name: product?.name || 'Product not found',
        product_image: product?.thumbnail_image || null,
        issue_description: warranty.issue_description,
        status: warranty.status,
        days_in_warranty: daysInWarranty,
        estimated_days: warranty.estimated_days || null,
        estimated_return_date: estimatedReturnDate,
        admin_notes: warranty.admin_notes || null,
        created_at: warranty.created_at,
        updated_at: warranty.updated_at
      }
    });
  } catch (error) {
    console.error('Get warranty error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get warranty claim'
    });
  }
});

// Create warranty claim (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { order_id, product_id, issue_description } = req.body;
    
    if (!order_id || !product_id || !issue_description) {
      return res.status(400).json({
        result: false,
        message: 'Order ID, Product ID, and issue description are required'
      });
    }
    
    const db = getDB();
    
    // Verify order belongs to user
    const order = await db.collection('orders').findOne({ 
      _id: toObjectId(order_id),
      $or: [
        { user_id: toObjectId(req.userId) },
        { 'customer.mobile': req.user.phone }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        result: false,
        message: 'Order not found or does not belong to you'
      });
    }
    
    // Verify product is in order
    const productInOrder = order.items?.find(item => 
      item.id === product_id || item.product_id === product_id
    );
    
    if (!productInOrder) {
      return res.status(400).json({
        result: false,
        message: 'Product not found in this order'
      });
    }
    
    // Check if product has warranty
    const product = await db.collection('products').findOne({ _id: toObjectId(product_id) });
    if (!product || !product.warranty_period) {
      return res.status(400).json({
        result: false,
        message: 'This product does not have warranty'
      });
    }
    
    // Check if warranty period is still valid
    const orderDate = new Date(order.created_at);
    const warrantyExpiryDate = new Date(orderDate);
    warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + (product.warranty_period || 0));
    
    if (new Date() > warrantyExpiryDate) {
      return res.status(400).json({
        result: false,
        message: 'Warranty period has expired'
      });
    }
    
    // Check if warranty claim already exists for this product in this order
    const existingClaim = await db.collection('warranty_claims').findOne({
      order_id: toObjectId(order_id),
      product_id: toObjectId(product_id),
      status: { $in: ['pending', 'processing', 'approved'] }
    });
    
    if (existingClaim) {
      return res.status(400).json({
        result: false,
        message: 'A warranty claim already exists for this product'
      });
    }
    
    // Create warranty claim
    const warrantyClaim = {
      order_id: toObjectId(order_id),
      product_id: toObjectId(product_id),
      user_id: toObjectId(req.userId),
      issue_description: issue_description.trim(),
      status: 'pending',
      estimated_days: null,
      admin_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('warranty_claims').insertOne(warrantyClaim);
    
    return res.status(201).json({
      result: true,
      success: true,
      message: 'Warranty claim submitted successfully',
      data: {
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Create warranty claim error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to create warranty claim'
    });
  }
});

module.exports = router;

