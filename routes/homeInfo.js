const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get home bottom info
router.get('/home-bottom-info', async (req, res) => {
  try {
    const db = getDB();
    
    const homeInfo = await db.collection('home_bottom_info')
      .findOne({ active: true });

    if (!homeInfo) {
      return res.json({
        success: true,
        data: []
      });
    }

    const formatted = {
      id: homeInfo._id.toString(),
      title: homeInfo.title || '',
      description: homeInfo.description || '',
      image: homeInfo.image || homeInfo.banner_image_one || homeInfo.banner_image_two || '',
      banner_image_one: homeInfo.banner_image_one || homeInfo.image || '',
      banner_image_two: homeInfo.banner_image_two || '',
      info_rows: homeInfo.info_rows || []
    };

    return res.json({
      success: true,
      data: [formatted]
    });
  } catch (error) {
    console.error('Get home bottom info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get home bottom info'
    });
  }
});

// Get home bottom SEO
router.get('/home-bottom-seo', async (req, res) => {
  try {
    const db = getDB();
    
    const seoData = await db.collection('home_bottom_seo')
      .findOne({ active: true });

    if (!seoData) {
      return res.json({
        success: true,
        data: {
          title: '',
          description: ''
        }
      });
    }

    const formatted = {
      id: seoData._id.toString(),
      title: seoData.title || '',
      description: seoData.description || ''
    };

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Get home bottom SEO error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get home bottom SEO'
    });
  }
});

// Get smartphone brands section data
router.get('/smartphone-brands', async (req, res) => {
  try {
    const db = getDB();
    
    const smartphoneBrands = await db.collection('home_smartphone_brands')
      .findOne({ active: true });

    if (!smartphoneBrands) {
      return res.json({
        success: true,
        data: {
          title: '',
          subtitle: ''
        }
      });
    }

    const formatted = {
      id: smartphoneBrands._id.toString(),
      title: smartphoneBrands.title || '',
      subtitle: smartphoneBrands.subtitle || ''
    };

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Get smartphone brands error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get smartphone brands'
    });
  }
});

module.exports = router;

