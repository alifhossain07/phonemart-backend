const express = require('express');
const { getDB } = require('../config/database');
const { formatProduct } = require('../utils/helpers');

const router = express.Router();

// Get search suggestions (products and categories)
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const db = getDB();

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim();
    const limitNum = parseInt(limit) || 10;

    // Search products by name, description, or category name
    const products = await db.collection('products')
      .find({
        published: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .limit(limitNum)
      .toArray();

    // Also search categories
    const categories = await db.collection('categories')
      .find({
        name: { $regex: searchTerm, $options: 'i' }
      })
      .limit(5)
      .toArray();

    // Format products
    const formattedProducts = products.map(p => {
      const formatted = formatProduct(p);
      return {
        id: formatted.id,
        name: formatted.name,
        slug: formatted.slug,
        price: formatted.main_price || formatted.base_price || 0,
        image: formatted.thumbnail_image || formatted.images?.[0] || '',
        type: 'product'
      };
    });

    // Format categories
    const formattedCategories = categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      type: 'category'
    }));

    // Combine and return
    const suggestions = [...formattedProducts, ...formattedCategories].slice(0, limitNum);

    return res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
});

module.exports = router;
