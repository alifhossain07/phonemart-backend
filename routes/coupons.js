const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Apply coupon
router.post('/', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        result: false,
        message: 'Coupon code is required'
      });
    }

    const db = getDB();
    const codeUpper = code.toUpperCase().trim();
    const currentDate = new Date();
    
    // First, find the coupon by code (without date/active filters) to debug
    const couponByCode = await db.collection('coupons').findOne({
      code: codeUpper
    });
    
    console.log('Coupon lookup:', {
      requestedCode: codeUpper,
      couponFound: !!couponByCode,
      currentDate: currentDate.toISOString(),
      couponDetails: couponByCode ? {
        code: couponByCode.code,
        active: couponByCode.active,
        start_date: couponByCode.start_date,
        end_date: couponByCode.end_date,
        startValid: couponByCode.start_date ? new Date(couponByCode.start_date) <= currentDate : 'N/A',
        endValid: couponByCode.end_date ? new Date(couponByCode.end_date) >= currentDate : 'N/A'
      } : null
    });
    
    // Now find with all filters
    const coupon = await db.collection('coupons').findOne({
      code: codeUpper,
      active: true,
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate }
    });

    if (!coupon) {
      // Provide more specific error message
      if (!couponByCode) {
        return res.status(400).json({
          result: false,
          message: 'Invalid coupon code'
        });
      }
      
      if (!couponByCode.active) {
        return res.status(400).json({
          result: false,
          message: 'Coupon code is not active'
        });
      }
      
      const startDate = new Date(couponByCode.start_date);
      const endDate = new Date(couponByCode.end_date);
      
      if (currentDate < startDate) {
        return res.status(400).json({
          result: false,
          message: `Coupon code is not yet valid. Valid from ${startDate.toLocaleDateString()}`
        });
      }
      
      if (currentDate > endDate) {
        return res.status(400).json({
          result: false,
          message: `Coupon code has expired. Expired on ${endDate.toLocaleDateString()}`
        });
      }
      
      return res.status(400).json({
        result: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check minimum purchase amount if set
    const cartAmount = req.body.amount || 0;
    if (coupon.min_purchase && cartAmount < coupon.min_purchase) {
      return res.status(400).json({
        result: false,
        message: `Minimum purchase amount of ৳${coupon.min_purchase.toLocaleString()} required`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = cartAmount * (coupon.discount / 100);
      // Apply max_discount limit if set
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount;
    }

    // Ensure discount doesn't exceed cart amount
    discount = Math.min(discount, cartAmount);

    return res.json({
      result: true,
      success: true,
      message: 'Coupon applied successfully',
      data: {
        id: coupon._id?.toString(),
        code: coupon.code,
        type: coupon.type,
        value: coupon.discount,
        discount: discount,
        discount_percentage: coupon.type === 'percentage' ? coupon.discount : null,
        discount_amount: coupon.type === 'flat' ? coupon.discount : null,
        min_order: coupon.min_purchase || null,
        max_discount: coupon.max_discount || null
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to apply coupon'
    });
  }
});

module.exports = router;

