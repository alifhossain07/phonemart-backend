const express = require('express');
const { getDB } = require('../config/database');
const { formatCategory } = require('../utils/helpers');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories')
      .find({})
      .sort({ order: 1, name: 1 })
      .toArray();

    const formattedCategories = categories.map(c => formatCategory(c));

    return res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// Get featured categories
router.get('/featured', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories')
      .find({ featured: true })
      .sort({ order: 1, name: 1 })
      .toArray();

    const formattedCategories = categories.map(c => formatCategory(c));

    return res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get featured categories'
    });
  }
});

// Get categories menu (hierarchical structure for navbar)
router.get('/menu', async (req, res) => {
  try {
    const db = getDB();
    
    // Get all categories with their parent relationships
    const allCategories = await db.collection('categories')
      .find({})
      .sort({ order: 1, name: 1 })
      .toArray();

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map of all categories
    allCategories.forEach(cat => {
      const formatted = formatCategory(cat);
      formatted.children = [];
      categoryMap.set(cat._id.toString(), formatted);
    });

    // Second pass: build tree structure
    allCategories.forEach(cat => {
      const formatted = categoryMap.get(cat._id.toString());
      
      if (cat.parent_id) {
        const parentId = cat.parent_id.toString();
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(formatted);
        } else {
          // Parent not found, treat as root
          rootCategories.push(formatted);
        }
      } else {
        // Root category
        rootCategories.push(formatted);
      }
    });

    // Third pass: sort children and build nested structure (3 levels deep)
    const buildHierarchy = (categories, level = 0) => {
      if (level >= 3) return categories; // Limit to 3 levels
      
      return categories.map(cat => {
        if (cat.children && cat.children.length > 0) {
          cat.children = buildHierarchy(cat.children, level + 1);
        }
        return cat;
      });
    };

    const hierarchicalCategories = buildHierarchy(rootCategories);

    return res.json({
      success: true,
      data: hierarchicalCategories
    });
  } catch (error) {
    console.error('Get categories menu error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get categories menu'
    });
  }
});

module.exports = router;

