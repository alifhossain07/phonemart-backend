const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get shipping config
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    
    // Get shipping configuration
    const config = await db.collection('shipping_config').findOne({});

    const defaultConfig = {
      shipping_cost_inside_dhaka: 60,
      shipping_cost_outside_dhaka: 140,
      free_shipping_min_amount: 0,
      currency_symbol: "৳",
      currency_code: "BDT"
    };

    // If config exists, merge with defaults
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

    return res.json({
      result: true,
      data: mergedConfig
    });
  } catch (error) {
    console.error('Get shipping config error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get shipping config'
    });
  }
});

// Get shipping config (alternative route: /config for backward compatibility)
router.get('/config', async (req, res) => {
  try {
    const db = getDB();
    
    // Get shipping configuration
    const config = await db.collection('shipping_config').findOne({});

    const defaultConfig = {
      shipping_cost_inside_dhaka: 60,
      shipping_cost_outside_dhaka: 140,
      free_shipping_min_amount: 0,
      currency_symbol: "৳",
      currency_code: "BDT"
    };

    // If config exists, merge with defaults
    const mergedConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

    return res.json({
      result: true,
      data: mergedConfig
    });
  } catch (error) {
    console.error('Get shipping config error:', error);
    return res.status(500).json({
      result: false,
      message: 'Failed to get shipping config'
    });
  }
});

// Get pickup list
router.get('/pickup-list', async (req, res) => {
  try {
    const db = getDB();
    const pickupPoints = await db.collection('pickup_points')
      .find({ active: true })
      .sort({ name: 1 })
      .toArray();

    const formattedPoints = pickupPoints.map(p => ({
      id: p._id.toString(),
      name: p.name,
      address: p.address,
      phone: p.phone || null,
      email: p.email || null
    }));

    return res.json({
      success: true,
      data: formattedPoints
    });
  } catch (error) {
    console.error('Get pickup list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pickup list'
    });
  }
});

module.exports = router;

