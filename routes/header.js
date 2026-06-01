const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get header logo
router.get('/logo', async (req, res) => {
  try {
    const db = getDB();
    
    // Get logo from business settings
    const setting = await db.collection('business_settings')
      .findOne({ type: 'header_logo' });

    const logo = setting ? setting.value : null;

    return res.json({
      success: true,
      data: {
        logo: logo
      }
    });
  } catch (error) {
    console.error('Get header logo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get header logo'
    });
  }
});

module.exports = router;

