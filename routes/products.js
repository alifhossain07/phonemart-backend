const express = require('express');
const { getDB } = require('../config/database');
const { toObjectId, paginate, buildPaginationMeta, formatProduct } = require('../utils/helpers');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Search products
router.get('/search', async (req, res) => {
  try {
    const { name, categories, brands, min, max, sort_key, digital, colors, choice_options, page, per_page } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

    let query = { published: true };

    // Search by name
    if (name) {
      query.$or = [
        { name: { $regex: name, $options: 'i' } },
        { description: { $regex: name, $options: 'i' } }
      ];
    }

    // Filter by categories
    if (categories) {
      const categoryIds = categories.split(',').map(id => toObjectId(id)).filter(Boolean);
      if (categoryIds.length > 0) {
        query.category_id = { $in: categoryIds };
      }
    }

    // Filter by brands
    if (brands) {
      const brandIds = brands.split(',').map(id => toObjectId(id)).filter(Boolean);
      if (brandIds.length > 0) {
        query.brand_id = { $in: brandIds };
      }
    }

    // Filter by colors
    if (colors) {
      const colorArray = colors.split(',').filter(Boolean);
      if (colorArray.length > 0) {
        query.colors = { $in: colorArray };
      }
    }

    // Filter by choice_options (e.g., Storage, Region)
    // Format: "Storage:128GB,256GB|Region:Global,Local"
    if (choice_options) {
      const optionFilters = choice_options.split('|').filter(Boolean);
      optionFilters.forEach(optionFilter => {
        const [optionName, optionValues] = optionFilter.split(':');
        if (optionName && optionValues) {
          const values = optionValues.split(',').filter(Boolean);
          if (values.length > 0) {
            // Add filter for products that have this choice_option with these values
            query.$and = query.$and || [];
            query.$and.push({
              choice_options: {
                $elemMatch: {
                  title: optionName,
                  options: { $in: values }
                }
              }
            });
          }
        }
      });
    }

    // Price range - check both base_price (new) and main_price (legacy)
    if (min || max) {
      const minPrice = min ? parseFloat(min) : 0;
      const maxPrice = max ? parseFloat(max) : Infinity;
      
      query.$or = query.$or || [];
      query.$or.push(
        // New products with base_price
        {
          base_price: {
            ...(min ? { $gte: minPrice } : {}),
            ...(max ? { $lte: maxPrice } : {})
          }
        },
        // Legacy products with main_price
        {
          main_price: {
            ...(min ? { $gte: minPrice } : {}),
            ...(max ? { $lte: maxPrice } : {})
          },
          base_price: { $exists: false }
        }
      );
    }

    // Digital products
    if (digital !== undefined) {
      query.digital = digital === '1' || digital === 'true';
    }

    // Sort
    let sort = { created_at: -1 };
    if (sort_key) {
      switch (sort_key) {
        case 'price_low_to_high':
          // Sort by base_price (new products) or main_price (legacy products)
          // Note: Legacy products without base_price will be sorted by main_price
          sort = { base_price: 1, main_price: 1 };
          break;
        case 'price_high_to_low':
          sort = { base_price: -1, main_price: -1 };
          break;
        case 'newest':
          sort = { created_at: -1 };
          break;
        case 'oldest':
          sort = { created_at: 1 };
          break;
        case 'rating':
          sort = { rating: -1 };
          break;
        default:
          sort = { created_at: -1 };
      }
    }

    const products = await db.collection('products')
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, pageNum, perPage)
    });
  } catch (error) {
    console.error('Search products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page, per_page } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

    const categoryDoc = await db.collection('categories').findOne({ slug: category });
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let query = { category_id: categoryDoc._id, published: true };
    
    // Apply attribute filters from query params
    const { colors, choice_options } = req.query;
    
    // Filter by colors
    if (colors) {
      const colorArray = colors.split(',').filter(Boolean);
      if (colorArray.length > 0) {
        query.colors = { $in: colorArray };
      }
    }
    
    // Filter by choice_options (e.g., Storage, Region)
    if (choice_options) {
      const optionFilters = choice_options.split('|').filter(Boolean);
      optionFilters.forEach((optionFilter) => {
        const [optionName, optionValues] = optionFilter.split(':');
        if (optionName && optionValues) {
          const values = optionValues.split(',').filter(Boolean);
          if (values.length > 0) {
            query.$and = query.$and || [];
            query.$and.push({
              choice_options: {
                $elemMatch: {
                  title: optionName,
                  options: { $in: values }
                }
              }
            });
          }
        }
      });
    }
    
    const products = await db.collection('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, pageNum, perPage),
      subtitle: `Products in ${categoryDoc.name}`,
      category: {
        id: categoryDoc._id.toString(),
        name: categoryDoc.name,
        slug: categoryDoc.slug
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get category products'
    });
  }
});

// Get featured products (alias for /featureproducts)
router.get('/featured', async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

    const query = { featured: true, published: true };
    const products = await db.collection('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, pageNum, perPage)
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get featured products'
    });
  }
});

// Get featured products (keep old route for backward compatibility)
router.get('/featureproducts', async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

    const query = { featured: true, published: true };
    const products = await db.collection('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, pageNum, perPage)
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get featured products'
    });
  }
});

// Get new arrivals
router.get('/new-arrivals', async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = { 
      published: true,
      created_at: { $gte: thirtyDaysAgo }
    };
    const products = await db.collection('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, pageNum, perPage)
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get new arrivals'
    });
  }
});

// Get flash sale products
router.get('/flashsale', async (req, res) => {
  try {
    const db = getDB();
    
    // Get active flash deal
    const flashDeal = await db.collection('flash_deals').findOne({
      status: 1,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() }
    });

    if (!flashDeal) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get products in flash deal
    const productIds = flashDeal.products?.map(p => toObjectId(p.product_id)) || [];
    const products = await db.collection('products')
      .find({ _id: { $in: productIds }, published: true })
      .toArray();

    const formattedProducts = products.map(p => formatProduct(p));

    return res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Get flash sale error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get flash sale products'
    });
  }
});

// Get products by type (earbuds, earphones, etc.)
const createTypeRoute = (type) => {
  router.get(`/${type}`, async (req, res) => {
    try {
      const { page, per_page } = req.query;
      const db = getDB();
      const { skip, limit, page: pageNum, perPage } = paginate(page, per_page);

      // Find category by name/slug
      const category = await db.collection('categories').findOne({
        $or: [
          { slug: type },
          { name: { $regex: type, $options: 'i' } }
        ]
      });

      if (!category) {
        return res.json({
          success: true,
          data: [],
          meta: buildPaginationMeta(0, pageNum, perPage)
        });
      }

      const query = { category_id: category._id, published: true };
      const products = await db.collection('products')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db.collection('products').countDocuments(query);

      const formattedProducts = products.map(p => formatProduct(p));

      return res.json({
        success: true,
        data: formattedProducts,
        meta: buildPaginationMeta(total, pageNum, perPage)
      });
    } catch (error) {
      console.error(`Get ${type} products error:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to get ${type} products`
      });
    }
  });
};

// Create routes for product types
['earbuds', 'earphones', 'neckbands', 'powerbanks', 'fast-chargers', 'fastcable'].forEach(createTypeRoute);

// Get product by slug (MUST be last to avoid route conflicts)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDB();

    // Check if user is authenticated (for tracking last viewed products)
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (e) {
      // Not authenticated, continue as guest
    }

    const product = await db.collection('products').findOne({ slug, published: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Track last viewed product if user is authenticated
    if (userId) {
      try {
        await db.collection('last_viewed_products').updateOne(
          { user_id: toObjectId(userId), product_id: product._id },
          {
            $set: {
              user_id: toObjectId(userId),
              product_id: product._id,
              viewed_at: new Date()
            }
          },
          { upsert: true }
        );
      } catch (e) {
        console.error('Error tracking viewed product:', e);
      }
    }

    // Get category and brand info
    const category = product.category_id 
      ? await db.collection('categories').findOne({ _id: product.category_id })
      : null;
    const brand = product.brand_id 
      ? await db.collection('brands').findOne({ _id: product.brand_id })
      : null;

    const formattedProduct = formatProduct(product, true);
    formattedProduct.category = category ? { id: category._id.toString(), name: category.name, slug: category.slug } : null;
    formattedProduct.brand = brand ? { id: brand._id.toString(), name: brand.name, slug: brand.slug } : null;

    return res.json({
      success: true,
      data: [formattedProduct]
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get product'
    });
  }
});

module.exports = router;

