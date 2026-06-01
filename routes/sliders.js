const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get sliders
router.get('/', async (req, res) => {
  console.log('🔵 SLIDERS API ROUTE HIT - /api/v2/sliders');
  try {
    const db = getDB();
    console.log('🔵 Database connection obtained');
    
    // Get all sliders first to debug
    const allSliders = await db.collection('sliders').find({}).toArray();
    console.log('=== SLIDERS DEBUG ===');
    console.log('Total sliders in database:', allSliders.length);
    if (allSliders.length > 0) {
      console.log('Slider details:');
      allSliders.forEach(s => {
        console.log(`  - ID: ${s._id.toString()}, Active: ${s.active} (${typeof s.active}), Photo: ${s.photo ? 'exists' : 'missing'}`);
      });
    }
    console.log('====================');
    
    // Return all sliders (filter can be added back later if needed)
    const sliders = await db.collection('sliders')
      .find({}) // Get all sliders
      .sort({ order: 1, created_at: -1 })
      .toArray();

    console.log('Sliders found:', sliders.length);

    const formattedSliders = sliders.map(s => ({
      id: s._id.toString(),
      photo: s.photo || s.image || null,
      order: s.order || 0
    }));

    return res.json({
      success: true,
      data: formattedSliders
    });
  } catch (error) {
    console.error('Get sliders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sliders'
    });
  }
});

module.exports = router;

