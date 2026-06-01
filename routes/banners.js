const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get banners (with optional type filter)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const db = getDB();
    
    // Build query
    const query = { active: true };
    if (type) {
      query.type = type;
    }
    
    const banners = await db.collection('banners')
      .find(query)
      .sort({ position: 1, created_at: -1 })
      .toArray();

    const formattedBanners = banners.map(b => ({
      id: b._id.toString(),
      photo: b.photo,
      url: b.url || null,
      position: b.position || 0,
      type: b.type || null
    }));

    return res.json({
      success: true,
      data: formattedBanners
    });
  } catch (error) {
    console.error('Get banners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get banners'
    });
  }
});

// Get home bottom banner
router.get('/home-bottom-banner', async (req, res) => {
  try {
    const db = getDB();
    const bottomBanner = await db.collection('home_bottom_banners')
      .findOne({ active: true });

    if (!bottomBanner) {
      return res.json({
        success: true,
        data: []
      });
    }

    const formatted = {
      id: bottomBanner._id.toString(),
      image: bottomBanner.image || null,
      title: bottomBanner.title || '',
      subtitle: bottomBanner.subtitle || '',
      icons: bottomBanner.icons || []
    };

    return res.json({
      success: true,
      data: [formatted]
    });
  } catch (error) {
    console.error('Get home bottom banner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get home bottom banner'
    });
  }
});

module.exports = router;

