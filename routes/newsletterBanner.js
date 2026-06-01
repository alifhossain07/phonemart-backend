const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get newsletter banner (home bottom banner)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const bottomBanner = await db.collection('home_bottom_banners')
      .findOne({ active: true });

    if (!bottomBanner) {
      return res.json({
        success: true,
        data: null
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
      data: formatted
    });
  } catch (error) {
    console.error('Get newsletter banner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get newsletter banner'
    });
  }
});

module.exports = router;

