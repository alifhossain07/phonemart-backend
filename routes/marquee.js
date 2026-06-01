const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get active marquee announcements
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    
    // Get all active marquee items, sorted by order
    const marqueeItems = await db.collection('marquee_announcements')
      .find({ active: true })
      .sort({ order: 1, created_at: -1 })
      .toArray();
    
    // Format response
    const formattedItems = marqueeItems.map(item => ({
      id: item._id.toString(),
      text: item.text,
      order: item.order || 0
    }));
    
    return res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('Get marquee announcements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get marquee announcements'
    });
  }
});

module.exports = router;

