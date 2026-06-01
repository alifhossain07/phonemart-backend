const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get brand categories (selected brands)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    
    // Get brands that are marked as selected/featured
    const brands = await db.collection('brands')
      .find({ selected: true })
      .sort({ name: 1 })
      .toArray();

    const formattedBrands = brands.map(b => ({
      name: b.name,
      icon: b.icon || null
    }));

    return res.json({
      success: true,
      title: 'Our Brands',
      subtitle: 'Shop from trusted brands',
      data: {
        data: formattedBrands
      }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get brands'
    });
  }
});

module.exports = router;

