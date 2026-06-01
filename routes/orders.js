const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId, generateOrderCode, formatOrder, calculatePriceFromDiscount } = require('../utils/helpers');

const router = express.Router();

// Create order (checkout) - supports both authenticated and guest users
router.post('/checkout', async (req, res) => {
  try {
    const { customer, items, shipping_method, shipping_zone, payment_method, payment_number, promo_code, note, pickup_point_id, carrier_id } = req.body;
    
    // Extract user_id from JWT token if present (optional auth)
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (e) {
      // Token invalid or missing - continue as guest
      userId = null;
    }
    
    const { toObjectId } = require('../utils/helpers');

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        result: false,
        message: 'Customer and items are required'
      });
    }

    const db = getDB();
    let totalAmount = 0;
    let discountAmount = 0;
    let shippingCost = 0;

    // Calculate total from items
    const orderItems = [];
    for (const item of items) {
      if (!item.id) {
        return res.status(400).json({
          result: false,
          message: `Invalid item: missing product ID`
        });
      }
      
      const productId = toObjectId(item.id);
      if (!productId) {
        return res.status(400).json({
          result: false,
          message: `Invalid product ID: ${item.id}`
        });
      }
      
      const product = await db.collection('products').findOne({ _id: productId });
      if (!product) {
        return res.status(400).json({
          result: false,
          message: `Product with id ${item.id} not found`
        });
      }

      const qty = parseInt(item.qty) || 1;
      // Calculate price from base_price and discount, or use legacy main_price
      let price = 0;
      if (product.base_price !== undefined) {
        const priceData = calculatePriceFromDiscount(
          product.base_price || 0,
          product.discount_type || null,
          product.discount_value || null
        );
        price = priceData.mainPrice;
      } else {
        price = product.main_price || 0;
      }
      const itemTotal = price * qty;

      orderItems.push({
        id: product._id.toString(),
        name: product.name,
        qty,
        price,
        total: itemTotal,
        variant: item.variant || null,
        image: product.thumbnail_image || null
      });

      totalAmount += itemTotal;
    }

    // Apply coupon if provided
    if (promo_code) {
      const coupon = await db.collection('coupons').findOne({
        code: promo_code.toUpperCase(),
        active: true,
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() }
      });

      if (coupon) {
        // Check minimum purchase amount if set
        if (coupon.min_purchase && totalAmount < coupon.min_purchase) {
          return res.status(400).json({
            result: false,
            message: `Minimum purchase amount of ৳${coupon.min_purchase.toLocaleString()} required for this coupon`
          });
        }

        // Calculate discount
        if (coupon.type === 'percentage') {
          discountAmount = (totalAmount * coupon.discount) / 100;
          // Apply max_discount limit if set
          if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        } else {
          discountAmount = coupon.discount;
        }
        
        // Ensure discount doesn't exceed total amount
        discountAmount = Math.min(discountAmount, totalAmount);
      } else {
        return res.status(400).json({
          result: false,
          message: 'Invalid or expired coupon code'
        });
      }
    }

    // Calculate shipping cost from shipping config
    if (shipping_method === 'home_delivery') {
      const shippingConfig = await db.collection('shipping_config').findOne({});
      const defaultInsideCost = 60;
      const defaultOutsideCost = 140;
      
      if (shipping_zone === 'insideDhaka') {
        shippingCost = (shippingConfig && shippingConfig.shipping_cost_inside_dhaka) ? shippingConfig.shipping_cost_inside_dhaka : defaultInsideCost;
      } else if (shipping_zone === 'outsideDhaka') {
        shippingCost = (shippingConfig && shippingConfig.shipping_cost_outside_dhaka) ? shippingConfig.shipping_cost_outside_dhaka : defaultOutsideCost;
      } else {
        // Fallback to outside cost if zone not specified
        shippingCost = (shippingConfig && shippingConfig.shipping_cost_outside_dhaka) ? shippingConfig.shipping_cost_outside_dhaka : defaultOutsideCost;
      }
    }

    const finalAmount = totalAmount - discountAmount + shippingCost;

    // Create order
    const order = {
      order_code: generateOrderCode(),
      customer: {
        name: customer.name || '',
        mobile: customer.mobile || '',
        email: customer.email || null,
        address: customer.address || '',
        country_id: customer.country_id || null,
        state_id: customer.state_id || null,
        city_id: customer.city_id || null,
        area_id: customer.area_id || null,
        postal_code: customer.postal_code || null
      },
      items: orderItems,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      final_amount: finalAmount,
      shipping_method: shipping_method || 'home_delivery',
      shipping_zone: shipping_zone || null,
      payment_method: payment_method || 'cod',
      payment_number: payment_number || null,
      payment_status: (payment_method === 'cod' || payment_method === 'Cash on Delivery') ? 'unpaid' : 'pending',
      delivery_status: 'pending',
      promo_code: promo_code || null,
      note: note || '',
      pickup_point_id: pickup_point_id || null,
      carrier_id: carrier_id || null,
      user_id: userId ? toObjectId(userId) : null, // Set if user is logged in, null for guests
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const result = await db.collection('orders').insertOne(order);
      const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });

      if (!createdOrder) {
        throw new Error('Failed to retrieve created order');
      }

      // Update product stock only for COD orders
      // For Stripe payments, stock will be reduced after payment confirmation via webhook
      const isCOD = payment_method === 'cod' || payment_method === 'Cash on Delivery';
      if (isCOD) {
        for (const item of items) {
          const productId = toObjectId(item.id);
          if (productId) {
            try {
              await db.collection('products').updateOne(
                { _id: productId },
                { $inc: { current_stock: -(parseInt(item.qty) || 1) } }
              );
            } catch (stockError) {
              console.error(`Failed to update stock for product ${item.id}:`, stockError);
              // Continue with other products even if one fails
            }
          }
        }
      }

      return res.json({
        result: true,
        success: true,
        message: 'Order placed successfully',
        data: {
          order_id: createdOrder._id.toString(),
          order_code: createdOrder.order_code,
          total_amount: finalAmount
        }
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Create order error:', error);
    if (error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    const errorMessage = (error && error.message) ? error.message : (typeof error === 'string' ? error : 'Failed to create order');
    return res.status(500).json({
      result: false,
      success: false,
      error: errorMessage,
      message: errorMessage
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const order = await db.collection('orders').findOne({ _id: toObjectId(id) });

    if (!order) {
      return res.status(404).json({
        result: false,
        message: 'Order not found'
      });
    }

    const formattedOrder = formatOrder(order);

    return res.json({
      result: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get order'
    });
  }
});

module.exports = router;

