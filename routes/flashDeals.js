const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId } = require('../utils/helpers');

const router = express.Router();

// Get flash deals
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { toObjectId, formatProduct } = require('../utils/helpers');
    
    const flashDeals = await db.collection('flash_deals')
      .find({
        status: 1,
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() }
      })
      .sort({ created_at: -1 })
      .toArray();

    // Format deals with products included
    const formattedDeals = await Promise.all(flashDeals.map(async (deal) => {
      // Get products for this flash deal
      const productIds = deal.products?.map(p => toObjectId(p.product_id || p)) || [];
      const products = await db.collection('products')
        .find({ _id: { $in: productIds }, published: true })
        .toArray();

      const formattedProducts = products.map(p => formatProduct(p));

      return {
        id: deal._id.toString(),
        title: deal.title,
        slug: deal.slug,
        background_color: deal.background_color || '#000000',
        text_color: deal.text_color || '#ffffff',
        banner: deal.banner || null,
        homepage: deal.homepage || 0,
        date: Math.floor(new Date(deal.end_date).getTime() / 1000), // Unix timestamp for frontend countdown
        start_date: deal.start_date,
        end_date: deal.end_date,
        products: {
          data: formattedProducts
        }
      };
    }));

    return res.json({
      success: true,
      data: formattedDeals
    });
  } catch (error) {
    console.error('Get flash deals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get flash deals'
    });
  }
});

// Get flash deal by slug with all products
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDB();
    const { toObjectId, formatProduct } = require('../utils/helpers');
    
    const flashDeal = await db.collection('flash_deals').findOne({
      slug,
      status: 1,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() }
    });

    if (!flashDeal) {
      return res.status(404).json({
        success: false,
        message: 'Flash deal not found'
      });
    }

    // Get products for this flash deal
    const productIds = flashDeal.products?.map(p => toObjectId(p.product_id || p)) || [];
    const products = await db.collection('products')
      .find({ _id: { $in: productIds }, published: true })
      .toArray();

    const formattedProducts = products.map(p => formatProduct(p));

    const formattedDeal = {
      id: flashDeal._id.toString(),
      title: flashDeal.title,
      slug: flashDeal.slug,
      background_color: flashDeal.background_color || '#000000',
      text_color: flashDeal.text_color || '#ffffff',
      banner: flashDeal.banner || null,
      homepage: flashDeal.homepage || 0,
      date: Math.floor(new Date(flashDeal.end_date).getTime() / 1000), // Unix timestamp for countdown
      start_date: flashDeal.start_date,
      end_date: flashDeal.end_date,
      products: {
        data: formattedProducts
      }
    };

    return res.json({
      success: true,
      data: formattedDeal
    });
  } catch (error) {
    console.error('Get flash deal by slug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get flash deal'
    });
  }
});

// Get flash deal info by slug (backward compatibility)
router.get('/info/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDB();
    
    const flashDeal = await db.collection('flash_deals').findOne({
      slug,
      status: 1,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() }
    });

    if (!flashDeal) {
      return res.status(404).json({
        success: false,
        message: 'Flash deal not found'
      });
    }

    const formattedDeal = {
      id: flashDeal._id.toString(),
      title: flashDeal.title,
      slug: flashDeal.slug,
      background_color: flashDeal.background_color || '#000000',
      text_color: flashDeal.text_color || '#ffffff',
      banner: flashDeal.banner || null,
      start_date: flashDeal.start_date,
      end_date: flashDeal.end_date
    };

    return res.json({
      success: true,
      data: formattedDeal
    });
  } catch (error) {
    console.error('Get flash deal info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get flash deal info'
    });
  }
});

module.exports = router;

