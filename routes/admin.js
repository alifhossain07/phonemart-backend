const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { toObjectId, paginate, buildPaginationMeta, generateSlug } = require('../utils/helpers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Admin authentication middleware (cookie-based)
const checkAdminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    
    if (!token) {
      return res.redirect('/admin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const admin = await db.collection('users').findOne({ 
      _id: toObjectId(decoded.userId),
      role: 'admin'
    });

    if (!admin) {
      res.clearCookie('admin_token');
      return res.redirect('/admin/login');
    }

    req.admin = admin;
    req.adminId = admin._id.toString();
    next();
  } catch (error) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
};

// Redirect root admin to login or dashboard
router.get('/', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Login page
router.get('/login', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
});

// Login handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('admin/login', { error: 'Email and password are required' });
    }

    const db = getDB();
    const admin = await db.collection('users').findOne({ 
      email: email.toLowerCase(),
      role: 'admin'
    });

    if (!admin) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: admin._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie - check if request is secure (HTTPS) or behind proxy
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: isSecure, // Secure only if HTTPS
      sameSite: 'lax',
      path: '/'
    });

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin/login', { error: 'Login failed. Please try again.' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'lax',
    path: '/'
  });
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    
    const stats = {
      totalProducts: await db.collection('products').countDocuments(),
      publishedProducts: await db.collection('products').countDocuments({ published: true }),
      totalOrders: await db.collection('orders').countDocuments(),
      pendingOrders: await db.collection('orders').countDocuments({ delivery_status: 'pending' }),
      totalUsers: await db.collection('users').countDocuments({ role: 'customer' }),
      totalCategories: await db.collection('categories').countDocuments(),
      totalRevenue: 0
    };

    // Calculate total revenue
    const orders = await db.collection('orders')
      .find({ payment_status: 'paid' })
      .toArray();
    
    stats.totalRevenue = orders.reduce((sum, order) => sum + (order.final_amount || 0), 0);

    // Recent orders
    const recentOrders = await db.collection('orders')
      .find({})
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    res.render('admin/dashboard', {
      admin: req.admin,
      stats,
      recentOrders,
      page: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      admin: req.admin,
      stats: {},
      recentOrders: [],
      error: 'Failed to load dashboard data',
      page: 'dashboard'
    });
  }
});

// Products routes
router.get('/products', checkAdminAuth, async (req, res) => {
  try {
    const { page, search } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, '20');
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await db.collection('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('products').countDocuments(query);
    
    res.render('admin/products', {
      admin: req.admin,
      products,
      pagination: buildPaginationMeta(total, pageNum, perPage),
      search: search || '',
      page: 'products'
    });
  } catch (error) {
    console.error('Products page error:', error);
    res.render('admin/products', {
      admin: req.admin,
      products: [],
      error: 'Failed to load products',
      page: 'products'
    });
  }
});

// New product form
router.get('/products/new', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
    
    res.render('admin/product-form', {
      admin: req.admin,
      product: null,
      categories,
      page: 'products'
    });
  } catch (error) {
    console.error('New product form error:', error);
    res.redirect('/admin/products?error=Failed to load form');
  }
});

// Edit product form
router.get('/products/:id/edit', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const product = await db.collection('products').findOne({ _id: toObjectId(id) });
    if (!product) {
      return res.redirect('/admin/products?error=Product not found');
    }
    
    const categories = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
    
    res.render('admin/product-form', {
      admin: req.admin,
      product,
      categories,
      page: 'products'
    });
  } catch (error) {
    console.error('Edit product form error:', error);
    res.redirect('/admin/products?error=Failed to load product');
  }
});

// Create product
router.post('/products', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const {
      name, category_id, base_price, discount_type, discount_value,
      current_stock, thumbnail_image, description, warranty_period,
      featured, published
    } = req.body;
    
    if (!name || !base_price) {
      return res.redirect('/admin/products/new?error=Name and price are required');
    }
    
    const slug = generateSlug(name);
    
    // Check if slug already exists
    const existingProduct = await db.collection('products').findOne({ slug });
    if (existingProduct) {
      return res.redirect('/admin/products/new?error=Product with this name already exists');
    }
    
    const product = {
      name: name.trim(),
      slug,
      description: description || '',
      category_id: category_id ? toObjectId(category_id) : null,
      base_price: parseFloat(base_price) || 0,
      discount_type: discount_type || null,
      discount_value: discount_value ? parseFloat(discount_value) : null,
      current_stock: parseInt(current_stock) || 0,
      thumbnail_image: thumbnail_image || null,
      warranty_period: warranty_period ? parseInt(warranty_period) : null,
      featured: featured === 'on' || featured === true,
      published: published === 'on' || published === true,
      images: [],
      photos: [],
      specifications: [],
      featured_specs: [],
      basic_specs: null,
      colors: [],
      choice_options: [],
      variants: [],
      product_compatible: [],
      viewing_count: 0,
      units_sold: 0,
      rating: 0,
      sales: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('products').insertOne(product);
    res.redirect('/admin/products?success=Product created successfully');
  } catch (error) {
    console.error('Create product error:', error);
    res.redirect('/admin/products?error=Failed to create product');
  }
});

// Update product
router.post('/products/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const {
      name, category_id, base_price, discount_type, discount_value,
      current_stock, thumbnail_image, description, warranty_period,
      featured, published
    } = req.body;
    
    if (!name || !base_price) {
      return res.redirect(`/admin/products/${id}/edit?error=Name and price are required`);
    }
    
    const product = await db.collection('products').findOne({ _id: toObjectId(id) });
    if (!product) {
      return res.redirect('/admin/products?error=Product not found');
    }
    
    const slug = generateSlug(name);
    
    // Check if slug already exists for another product
    const existingProduct = await db.collection('products').findOne({ 
      slug,
      _id: { $ne: toObjectId(id) }
    });
    if (existingProduct) {
      return res.redirect(`/admin/products/${id}/edit?error=Product with this name already exists`);
    }
    
    const updateData = {
      name: name.trim(),
      slug,
      description: description || '',
      category_id: category_id ? toObjectId(category_id) : null,
      base_price: parseFloat(base_price) || 0,
      discount_type: discount_type || null,
      discount_value: discount_value ? parseFloat(discount_value) : null,
      current_stock: parseInt(current_stock) || 0,
      thumbnail_image: thumbnail_image || null,
      warranty_period: warranty_period ? parseInt(warranty_period) : null,
      featured: featured === 'on' || featured === true,
      published: published === 'on' || published === true,
      updated_at: new Date()
    };
    
    await db.collection('products').updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    res.redirect('/admin/products?success=Product updated successfully');
  } catch (error) {
    console.error('Update product error:', error);
    res.redirect(`/admin/products/${id}/edit?error=Failed to update product`);
  }
});

// Delete product
router.post('/products/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.collection('products').deleteOne({ _id: toObjectId(id) });
    res.redirect('/admin/products?success=Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    res.redirect('/admin/products?error=Failed to delete product');
  }
});

// Categories routes
router.get('/categories', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories')
      .find({})
      .sort({ order: 1, name: 1 })
      .toArray();
    
    res.render('admin/categories', {
      admin: req.admin,
      categories,
      page: 'categories'
    });
  } catch (error) {
    console.error('Categories page error:', error);
    res.render('admin/categories', {
      admin: req.admin,
      categories: [],
      error: 'Failed to load categories',
      page: 'categories'
    });
  }
});

// Get single category (for edit modal)
router.get('/categories/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const category = await db.collection('categories').findOne({ _id: toObjectId(id) });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      _id: category._id.toString(),
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      banner: category.banner || '',
      order: category.order || 0,
      featured: category.featured || false
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category'
    });
  }
});

// Create category
router.post('/categories', checkAdminAuth, async (req, res) => {
  try {
    const { name, icon, banner, order, featured } = req.body;
    const db = getDB();
    
    if (!name) {
      return res.redirect('/admin/categories?error=Category name is required');
    }
    
    const slug = generateSlug(name);
    
    // Check if slug already exists
    const existingCategory = await db.collection('categories').findOne({ slug });
    if (existingCategory) {
      return res.redirect('/admin/categories?error=Category with this name already exists');
    }
    
    const category = {
      name: name.trim(),
      slug,
      icon: icon || null,
      banner: banner || null,
      order: parseInt(order) || 0,
      featured: featured === 'on' || featured === true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('categories').insertOne(category);
    res.redirect('/admin/categories?success=Category created successfully');
  } catch (error) {
    console.error('Create category error:', error);
    res.redirect('/admin/categories?error=Failed to create category');
  }
});

// Update category handler (used for both POST and PUT)
const updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, banner, order, featured } = req.body;
    const db = getDB();
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const category = await db.collection('categories').findOne({ _id: toObjectId(id) });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const slug = generateSlug(name);
    
    // Check if slug already exists for another category
    const existingCategory = await db.collection('categories').findOne({ 
      slug,
      _id: { $ne: toObjectId(id) }
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const updateData = {
      name: name.trim(),
      slug,
      icon: icon || null,
      banner: banner || null,
      order: parseInt(order) || 0,
      featured: featured === 'on' || featured === true,
      updated_at: new Date()
    };
    
    await db.collection('categories').updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

// Update category (accepts both POST and PUT)
router.post('/categories/:id', checkAdminAuth, updateCategoryHandler);
router.put('/categories/:id', checkAdminAuth, updateCategoryHandler);

// Delete category
router.post('/categories/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // Check if category is used by any products
    const productsCount = await db.collection('products').countDocuments({ 
      category_id: toObjectId(id) 
    });
    
    if (productsCount > 0) {
      return res.redirect('/admin/categories?error=Cannot delete category with existing products');
    }
    
    await db.collection('categories').deleteOne({ _id: toObjectId(id) });
    res.redirect('/admin/categories?success=Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    res.redirect('/admin/categories?error=Failed to delete category');
  }
});

// Orders routes
router.get('/orders', checkAdminAuth, async (req, res) => {
  try {
    const { page, status } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, '20');
    
    let query = {};
    if (status) {
      query.delivery_status = status;
    }
    
    const orders = await db.collection('orders')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('orders').countDocuments(query);
    
    res.render('admin/orders', {
      admin: req.admin,
      orders,
      pagination: buildPaginationMeta(total, pageNum, perPage),
      status: status || '',
      page: 'orders'
    });
  } catch (error) {
    console.error('Orders page error:', error);
    res.render('admin/orders', {
      admin: req.admin,
      orders: [],
      error: 'Failed to load orders',
      page: 'orders'
    });
  }
});

// Get single order details (for modal)
router.get('/orders/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const order = await db.collection('orders').findOne({ _id: toObjectId(id) });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Format order data for response
    const orderData = {
      _id: order._id.toString(),
      id: order._id.toString(),
      order_code: order.order_code,
      customer: order.customer || {},
      items: order.items || [],
      total_amount: order.total_amount || 0,
      shipping_cost: order.shipping_cost || 0,
      discount_amount: order.discount_amount || 0,
      final_amount: order.final_amount || 0,
      payment_method: order.payment_method || 'cod',
      payment_status: order.payment_status || 'unpaid',
      delivery_status: order.delivery_status || 'pending',
      shipping_method: order.shipping_method || null,
      shipping_zone: order.shipping_zone || null,
      promo_code: order.promo_code || null,
      note: order.note || '',
      user_id: order.user_id ? order.user_id.toString() : null,
      created_at: order.created_at,
      updated_at: order.updated_at
    };
    
    res.json({
      success: true,
      result: true,
      data: orderData
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      result: false,
      message: 'Failed to get order details'
    });
  }
});

// Update order status
router.post('/orders/:id/status', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;
    const db = getDB();
    
    if (!delivery_status) {
      return res.redirect(`/admin/orders?error=Status is required`);
    }
    
    const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
    if (!validStatuses.includes(delivery_status)) {
      return res.redirect(`/admin/orders?error=Invalid status`);
    }
    
    await db.collection('orders').updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          delivery_status,
          updated_at: new Date()
        } 
      }
    );
    
    res.redirect('/admin/orders?success=Order status updated');
  } catch (error) {
    console.error('Update order status error:', error);
    res.redirect('/admin/orders?error=Failed to update order status');
  }
});

// Update order payment status
router.post('/orders/:id/payment-status', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;
    const db = getDB();
    
    if (!payment_status) {
      return res.redirect(`/admin/orders?error=Payment status is required`);
    }
    
    const validStatuses = ['unpaid', 'pending', 'paid'];
    if (!validStatuses.includes(payment_status)) {
      return res.redirect(`/admin/orders?error=Invalid payment status`);
    }
    
    await db.collection('orders').updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          payment_status,
          updated_at: new Date()
        } 
      }
    );
    
    res.redirect('/admin/orders?success=Payment status updated');
  } catch (error) {
    console.error('Update payment status error:', error);
    res.redirect('/admin/orders?error=Failed to update payment status');
  }
});

// Users Management
router.get('/users', checkAdminAuth, async (req, res) => {
  try {
    const { page, search } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, '20');
    
    let query = { role: 'customer' }; // Only show customer users, not admins
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await db.collection('users')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('users').countDocuments(query);
    
    // Get order count for each user
    const usersWithOrderCount = await Promise.all(users.map(async (user) => {
      const orderCount = await db.collection('orders').countDocuments({ user_id: user._id });
      return {
        ...user,
        orderCount
      };
    }));
    
    res.render('admin/users', {
      admin: req.admin,
      users: usersWithOrderCount,
      pagination: buildPaginationMeta(total, pageNum, perPage),
      search: search || '',
      page: 'users'
    });
  } catch (error) {
    console.error('Users page error:', error);
    res.render('admin/users', { admin: req.admin, users: [], error: 'Failed to load users' });
  }
});

// Get user details
router.get('/users/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const user = await db.collection('users').findOne({ _id: toObjectId(id) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user orders
    const orders = await db.collection('orders')
      .find({ user_id: toObjectId(id) })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    
    // Get wishlist count
    const wishlist = await db.collection('wishlists').findOne({ user_id: toObjectId(id) });
    const wishlistCount = wishlist ? (wishlist.products?.length || 0) : 0;
    
    // Format user data (remove password)
    const { password, ...userData } = user;
    
    res.json({
      success: true,
      data: {
        ...userData,
        id: user._id.toString(),
        orders: orders.map(order => ({
          id: order._id.toString(),
          order_code: order.order_code,
          final_amount: order.final_amount,
          delivery_status: order.delivery_status,
          payment_status: order.payment_status,
          created_at: order.created_at
        })),
        orderCount: orders.length,
        wishlistCount
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    });
  }
});

// Banners routes
router.get('/banners', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const banners = await db.collection('banners')
      .find({})
      .sort({ position: 1 })
      .toArray();
    
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('admin/banners', {
      admin: req.admin,
      banners,
      success,
      error,
      page: 'banners'
    });
  } catch (error) {
    console.error('Banners page error:', error);
    res.render('admin/banners', {
      admin: req.admin,
      banners: [],
      error: 'Failed to load banners',
      page: 'banners'
    });
  }
});

// Create or Update banner
router.post('/banners', checkAdminAuth, async (req, res) => {
  try {
    const { type, photo, active, url } = req.body;
    const db = getDB();
    
    if (!type || !photo) {
      return res.redirect('/admin/banners?error=Type and photo URL are required');
    }
    
    // Check if banner of this type already exists
    const existingBanner = await db.collection('banners').findOne({ type });
    
    const bannerData = {
      type,
      photo: photo.trim(),
      url: url ? url.trim() : null,
      active: active === 'on' || active === true,
      updated_at: new Date()
    };
    
    if (existingBanner) {
      // Update existing banner
      await db.collection('banners').updateOne(
        { _id: existingBanner._id },
        { $set: bannerData }
      );
      return res.redirect('/admin/banners?success=Banner updated successfully');
    } else {
      // Create new banner
      bannerData.position = 0;
      bannerData.created_at = new Date();
      await db.collection('banners').insertOne(bannerData);
      return res.redirect('/admin/banners?success=Banner created successfully');
    }
  } catch (error) {
    console.error('Create/Update banner error:', error);
    res.redirect('/admin/banners?error=Failed to save banner');
  }
});

// Delete banner
router.post('/banners/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const result = await db.collection('banners').deleteOne({ _id: toObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.redirect('/admin/banners?error=Banner not found');
    }
    
    res.redirect('/admin/banners?success=Banner deleted successfully');
  } catch (error) {
    console.error('Delete banner error:', error);
    res.redirect('/admin/banners?error=Failed to delete banner');
  }
});

// Sliders routes
router.get('/sliders', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const sliders = await db.collection('sliders')
      .find({})
      .sort({ order: 1 })
      .toArray();
    
    res.render('admin/sliders', {
      admin: req.admin,
      sliders,
      page: 'sliders'
    });
  } catch (error) {
    console.error('Sliders page error:', error);
    res.render('admin/sliders', {
      admin: req.admin,
      sliders: [],
      error: 'Failed to load sliders',
      page: 'sliders'
    });
  }
});

// Brands routes
router.get('/brands', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const brands = await db.collection('brands')
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    res.render('admin/brands', {
      admin: req.admin,
      brands,
      page: 'brands'
    });
  } catch (error) {
    console.error('Brands page error:', error);
    res.render('admin/brands', {
      admin: req.admin,
      brands: [],
      error: 'Failed to load brands',
      page: 'brands'
    });
  }
});

// Coupons routes
router.get('/coupons', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const coupons = await db.collection('coupons')
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    res.render('admin/coupons', {
      admin: req.admin,
      coupons,
      page: 'coupons'
    });
  } catch (error) {
    console.error('Coupons page error:', error);
    res.render('admin/coupons', {
      admin: req.admin,
      coupons: [],
      error: 'Failed to load coupons',
      page: 'coupons'
    });
  }
});

// Create coupon
router.post('/coupons', checkAdminAuth, async (req, res) => {
  try {
    const { code, type, discount, min_purchase, max_discount, start_date, end_date, active } = req.body;
    const db = getDB();
    
    if (!code || !type || !discount) {
      return res.redirect('/admin/coupons?error=Code, type, and discount are required');
    }
    
    // Check if coupon code already exists
    const existingCoupon = await db.collection('coupons').findOne({ 
      code: code.toUpperCase().trim() 
    });
    
    if (existingCoupon) {
      return res.redirect('/admin/coupons?error=Coupon code already exists');
    }
    
    const coupon = {
      code: code.toUpperCase().trim(),
      type: type === 'percentage' ? 'percentage' : 'flat',
      discount: parseFloat(discount) || 0,
      min_purchase: min_purchase ? parseFloat(min_purchase) : null,
      max_discount: max_discount ? parseFloat(max_discount) : null,
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
      active: active === 'on' || active === true || active === 'true',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('coupons').insertOne(coupon);
    res.redirect('/admin/coupons?success=Coupon created successfully');
  } catch (error) {
    console.error('Create coupon error:', error);
    res.redirect('/admin/coupons?error=Failed to create coupon');
  }
});

// Delete coupon
router.post('/coupons/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.collection('coupons').deleteOne({ _id: toObjectId(id) });
    res.redirect('/admin/coupons?success=Coupon deleted successfully');
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.redirect('/admin/coupons?error=Failed to delete coupon');
  }
});

// Flash Deals routes
router.get('/flash-deals', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    
    // Try to get flash deals, handle case where collection doesn't exist
    let flashDeals = [];
    try {
      flashDeals = await db.collection('flash_deals')
        .find({})
        .sort({ created_at: -1 })
        .toArray();
    } catch (dbError) {
      console.error('Error fetching flash deals:', dbError);
      // Collection might not exist yet, that's okay
      flashDeals = [];
    }
    
    // Fetch products for the product selector
    // Fetch all products (admin can see all, including unpublished)
    let products = [];
    try {
      products = await db.collection('products')
        .find({})
        .sort({ name: 1 })
        .toArray();
    } catch (dbError) {
      console.error('Error fetching products:', dbError);
      products = [];
    }
    
    res.render('admin/flash-deals', {
      admin: req.admin,
      flashDeals: flashDeals || [],
      products: products || [],
      page: 'flash-deals',
      error: null,
      query: req.query
    });
  } catch (error) {
    console.error('Flash deals page error:', error);
    console.error('Error stack:', error.stack);
    res.render('admin/flash-deals', {
      admin: req.admin,
      flashDeals: [],
      products: [],
      error: error.message || 'Failed to load flash deals',
      page: 'flash-deals',
      query: req.query
    });
  }
});

// Create flash deal
router.post('/flash-deals', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const {
      title,
      banner,
      start_date,
      end_date,
      background_color,
      text_color,
      homepage,
      status,
      products: productIds
    } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return res.redirect('/admin/flash-deals?error=Title, start date, and end date are required');
    }

    if (!productIds || (Array.isArray(productIds) && productIds.length === 0)) {
      return res.redirect('/admin/flash-deals?error=Please select at least one product');
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Check if slug already exists
    const existingDeal = await db.collection('flash_deals').findOne({ slug });
    if (existingDeal) {
      // Add timestamp to make it unique
      slug = `${slug}-${Date.now()}`;
    }

    // Format products array
    const products = Array.isArray(productIds) 
      ? productIds.map(id => ({ product_id: toObjectId(id) }))
      : [{ product_id: toObjectId(productIds) }];

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.redirect('/admin/flash-deals?error=Invalid date format');
    }

    if (endDate <= startDate) {
      return res.redirect('/admin/flash-deals?error=End date must be after start date');
    }

    // Create flash deal
    const flashDeal = {
      title: title.trim(),
      slug: slug,
      banner: banner && banner.trim() ? banner.trim() : null,
      start_date: startDate,
      end_date: endDate,
      background_color: background_color || '#000000',
      text_color: text_color || '#ffffff',
      homepage: homepage === 'on' || homepage === true ? 1 : 0,
      status: status === 'on' || status === true ? 1 : 0,
      products: products,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('flash_deals').insertOne(flashDeal);

    res.redirect('/admin/flash-deals?success=Flash deal created successfully');
  } catch (error) {
    console.error('Create flash deal error:', error);
    res.redirect('/admin/flash-deals?error=Failed to create flash deal: ' + error.message);
  }
});

// Get flash deal by ID (for editing)
router.get('/flash-deals/:id', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const flashDeal = await db.collection('flash_deals').findOne({
      _id: toObjectId(id)
    });

    if (!flashDeal) {
      return res.status(404).json({
        success: false,
        message: 'Flash deal not found'
      });
    }

    // Format the response
    const formattedDeal = {
      _id: flashDeal._id.toString(),
      id: flashDeal._id.toString(),
      title: flashDeal.title,
      slug: flashDeal.slug,
      banner: flashDeal.banner || null,
      start_date: flashDeal.start_date,
      end_date: flashDeal.end_date,
      background_color: flashDeal.background_color || '#000000',
      text_color: flashDeal.text_color || '#ffffff',
      homepage: flashDeal.homepage || 0,
      status: flashDeal.status || 0,
      products: flashDeal.products || []
    };

    res.json(formattedDeal);
  } catch (error) {
    console.error('Get flash deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get flash deal'
    });
  }
});

// Update flash deal
router.put('/flash-deals/:id', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      title,
      banner,
      start_date,
      end_date,
      background_color,
      text_color,
      homepage,
      status,
      products: productIds
    } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }

    if (!productIds || (Array.isArray(productIds) && productIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one product'
      });
    }

    // Check if flash deal exists
    const existingDeal = await db.collection('flash_deals').findOne({
      _id: toObjectId(id)
    });

    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: 'Flash deal not found'
      });
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Check if slug already exists for another deal
    const slugExists = await db.collection('flash_deals').findOne({
      slug,
      _id: { $ne: toObjectId(id) }
    });

    if (slugExists) {
      // Add timestamp to make it unique
      slug = `${slug}-${Date.now()}`;
    }

    // Format products array
    const products = Array.isArray(productIds)
      ? productIds.map(pid => ({ product_id: toObjectId(pid) }))
      : [{ product_id: toObjectId(productIds) }];

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Update flash deal
    const updateData = {
      title: title.trim(),
      slug: slug,
      banner: banner && banner.trim() ? banner.trim() : null,
      start_date: startDate,
      end_date: endDate,
      background_color: background_color || '#000000',
      text_color: text_color || '#ffffff',
      homepage: homepage === true || homepage === 1 ? 1 : 0,
      status: status === true || status === 1 ? 1 : 0,
      products: products,
      updated_at: new Date()
    };

    await db.collection('flash_deals').updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: 'Flash deal updated successfully'
    });
  } catch (error) {
    console.error('Update flash deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flash deal: ' + error.message
    });
  }
});

// Delete flash deal
router.post('/flash-deals/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    // Check if flash deal exists
    const flashDeal = await db.collection('flash_deals').findOne({
      _id: toObjectId(id)
    });

    if (!flashDeal) {
      return res.redirect('/admin/flash-deals?error=Flash deal not found');
    }

    // Delete the flash deal
    const result = await db.collection('flash_deals').deleteOne({
      _id: toObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.redirect('/admin/flash-deals?error=Failed to delete flash deal');
    }

    res.redirect('/admin/flash-deals?success=Flash deal deleted successfully');
  } catch (error) {
    console.error('Delete flash deal error:', error);
    res.redirect('/admin/flash-deals?error=Failed to delete flash deal: ' + error.message);
  }
});

// Settings routes
router.get('/settings', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    
    // Check if settings are stored as array format (type/value) or single document
    const settingsArray = await db.collection('business_settings')
      .find({})
      .toArray();
    
    let settings = {};
    
    if (settingsArray.length > 0) {
      // Check if it's the array format (type/value pairs)
      if (settingsArray[0].type && settingsArray[0].value !== undefined) {
        // Convert array format to object
        settingsArray.forEach(setting => {
          settings[setting.type] = setting.value;
        });
      } else {
        // It's a single document format
        settings = settingsArray[0];
      }
    }
    
    // Also fetch shipping config
    const shippingConfig = await db.collection('shipping_config').findOne({});
    
    res.render('admin/settings', {
      admin: req.admin,
      settings: settings || {},
      shippingConfig: shippingConfig || {},
      page: 'settings'
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.render('admin/settings', {
      admin: req.admin,
      settings: {},
      shippingConfig: {},
      error: 'Failed to load settings',
      page: 'settings'
    });
  }
});

// Update settings
router.post('/settings', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const {
      header_logo, footer_logo, about_us_description, frontend_copyright_text,
      contact_phone, contact_email, contact_address,
      facebook_link, twitter_link, instagram_link, youtube_link
    } = req.body;
    
    // Check current format
    const existingSettings = await db.collection('business_settings')
      .find({})
      .toArray();
    
    const settingsToUpdate = {
      header_logo: header_logo || null,
      footer_logo: footer_logo || null,
      about_us_description: about_us_description || '',
      frontend_copyright_text: frontend_copyright_text || '',
      contact_phone: contact_phone || '',
      contact_email: contact_email || '',
      contact_address: contact_address || '',
      facebook_link: facebook_link || null,
      twitter_link: twitter_link || null,
      instagram_link: instagram_link || null,
      youtube_link: youtube_link || null,
      updated_at: new Date()
    };
    
    if (existingSettings.length > 0 && existingSettings[0].type) {
      // Array format - update each setting
      const settingsArray = Object.keys(settingsToUpdate).map(key => ({
        type: key,
        value: settingsToUpdate[key]
      }));
      
      // Delete old settings
      await db.collection('business_settings').deleteMany({});
      
      // Insert new settings
      await db.collection('business_settings').insertMany(settingsArray.map(setting => ({
        ...setting,
        created_at: new Date()
      })));
    } else {
      // Single document format
      if (existingSettings.length > 0) {
        await db.collection('business_settings').updateOne(
          { _id: existingSettings[0]._id },
          { $set: settingsToUpdate }
        );
      } else {
        await db.collection('business_settings').insertOne({
          ...settingsToUpdate,
          created_at: new Date()
        });
      }
    }
    
    res.redirect('/admin/settings?success=Settings updated successfully');
  } catch (error) {
    console.error('Update settings error:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
});

// Update shipping settings
router.post('/settings/shipping', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const {
      shipping_cost_inside_dhaka,
      shipping_cost_outside_dhaka,
      free_shipping_min_amount
    } = req.body;
    
    const updateData = {
      shipping_cost_inside_dhaka: parseFloat(shipping_cost_inside_dhaka) || 60,
      shipping_cost_outside_dhaka: parseFloat(shipping_cost_outside_dhaka) || 140,
      free_shipping_min_amount: parseFloat(free_shipping_min_amount) || 0,
      updated_at: new Date()
    };
    
    const existing = await db.collection('shipping_config').findOne({});
    if (existing) {
      await db.collection('shipping_config').updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
    } else {
      await db.collection('shipping_config').insertOne({
        ...updateData,
        created_at: new Date()
      });
    }
    
    res.redirect('/admin/settings?success=Shipping settings updated successfully');
  } catch (error) {
    console.error('Update shipping settings error:', error);
    res.redirect('/admin/settings?error=Failed to update shipping settings');
  }
});

// Trust Signals routes
router.get('/trust-signals', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const trustSignals = await db.collection('trust_signals')
      .find({})
      .sort({ order: 1 })
      .toArray();
    
    res.render('admin/trust-signals', {
      admin: req.admin,
      trustSignals,
      page: 'trust-signals'
    });
  } catch (error) {
    console.error('Trust signals page error:', error);
    res.render('admin/trust-signals', {
      admin: req.admin,
      trustSignals: [],
      error: 'Failed to load trust signals',
      page: 'trust-signals'
    });
  }
});

// Marquee Announcement routes
router.get('/marquee', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const marqueeItems = await db.collection('marquee_announcements')
      .find({})
      .sort({ order: 1, created_at: -1 })
      .toArray();
    
    res.render('admin/marquee', {
      admin: req.admin,
      marqueeItems: marqueeItems || [],
      page: 'marquee',
      query: req.query
    });
  } catch (error) {
    console.error('Marquee page error:', error);
    res.render('admin/marquee', {
      admin: req.admin,
      marqueeItems: [],
      error: 'Failed to load marquee items',
      page: 'marquee',
      query: req.query
    });
  }
});

// Create marquee item
router.post('/marquee', checkAdminAuth, async (req, res) => {
  try {
    const { text, active, order } = req.body;
    const db = getDB();
    
    if (!text || !text.trim()) {
      return res.redirect('/admin/marquee?error=Text is required');
    }
    
    const marqueeItem = {
      text: text.trim(),
      active: active === 'on' || active === true,
      order: parseInt(order) || 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('marquee_announcements').insertOne(marqueeItem);
    res.redirect('/admin/marquee?success=Marquee item created successfully');
  } catch (error) {
    console.error('Create marquee error:', error);
    res.redirect('/admin/marquee?error=Failed to create marquee item');
  }
});

// Update marquee item
router.post('/marquee/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, active, order } = req.body;
    const db = getDB();
    
    if (!text || !text.trim()) {
      return res.redirect('/admin/marquee?error=Text is required');
    }
    
    const updateData = {
      text: text.trim(),
      active: active === 'on' || active === true,
      order: parseInt(order) || 0,
      updated_at: new Date()
    };
    
    await db.collection('marquee_announcements').updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    res.redirect('/admin/marquee?success=Marquee item updated successfully');
  } catch (error) {
    console.error('Update marquee error:', error);
    res.redirect('/admin/marquee?error=Failed to update marquee item');
  }
});

// Delete marquee item
router.post('/marquee/:id/delete', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.collection('marquee_announcements').deleteOne({ _id: toObjectId(id) });
    res.redirect('/admin/marquee?success=Marquee item deleted successfully');
  } catch (error) {
    console.error('Delete marquee error:', error);
    res.redirect('/admin/marquee?error=Failed to delete marquee item');
  }
});

// Home Content routes
router.get('/home-content', checkAdminAuth, async (req, res) => {
  try {
    const db = getDB();
    const homeInfo = await db.collection('home_info').findOne({});
    const newsletterBanner = await db.collection('newsletter_banner').findOne({});
    const smartphoneBrands = await db.collection('smartphone_brands').findOne({});
    const homeSeo = await db.collection('home_seo').findOne({});
    
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('admin/home-content', {
      admin: req.admin,
      homeInfo: homeInfo || {},
      newsletterBanner: newsletterBanner || {},
      smartphoneBrands: smartphoneBrands || {},
      homeSeo: homeSeo || {},
      success,
      error,
      page: 'home-content'
    });
  } catch (error) {
    console.error('Home content page error:', error);
    res.render('admin/home-content', {
      admin: req.admin,
      homeInfo: {},
      newsletterBanner: {},
      smartphoneBrands: {},
      homeSeo: {},
      error: 'Failed to load home content',
      page: 'home-content'
    });
  }
});

// Update home info
router.post('/home-content/info', checkAdminAuth, async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const db = getDB();
    
    const updateData = {
      title: title || '',
      description: description || '',
      banner_image_one: image || null,
      image: image || null,
      updated_at: new Date()
    };
    
    const existing = await db.collection('home_info').findOne({});
    if (existing) {
      await db.collection('home_info').updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
    } else {
      await db.collection('home_info').insertOne({
        ...updateData,
        created_at: new Date()
      });
    }
    
    res.redirect('/admin/home-content?success=Home bottom info updated successfully');
  } catch (error) {
    console.error('Update home info error:', error);
    res.redirect('/admin/home-content?error=Failed to update home info');
  }
});

// Update newsletter banner (middle banner)
router.post('/home-content/newsletter-banner', checkAdminAuth, async (req, res) => {
  try {
    const { title, subtitle, image } = req.body;
    const db = getDB();
    
    if (!title || !image) {
      return res.redirect('/admin/home-content?error=Title and image are required');
    }
    
    const updateData = {
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      image: image.trim(),
      active: true,
      updated_at: new Date()
    };
    
    const existing = await db.collection('newsletter_banner').findOne({});
    if (existing) {
      await db.collection('newsletter_banner').updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
    } else {
      await db.collection('newsletter_banner').insertOne({
        ...updateData,
        created_at: new Date()
      });
    }
    
    res.redirect('/admin/home-content?success=Newsletter banner updated successfully');
  } catch (error) {
    console.error('Update newsletter banner error:', error);
    res.redirect('/admin/home-content?error=Failed to update newsletter banner');
  }
});

// Update smartphone brands
router.post('/home-content/smartphone-brands', checkAdminAuth, async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    const db = getDB();
    
    const updateData = {
      title: title || '',
      subtitle: subtitle || '',
      updated_at: new Date()
    };
    
    const existing = await db.collection('smartphone_brands').findOne({});
    if (existing) {
      await db.collection('smartphone_brands').updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
    } else {
      await db.collection('smartphone_brands').insertOne({
        ...updateData,
        created_at: new Date()
      });
    }
    
    res.redirect('/admin/home-content?success=Smartphone brands section updated successfully');
  } catch (error) {
    console.error('Update smartphone brands error:', error);
    res.redirect('/admin/home-content?error=Failed to update smartphone brands');
  }
});

// Update home SEO
router.post('/home-content/seo', checkAdminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const db = getDB();
    
    const updateData = {
      title: title || '',
      description: description || '',
      updated_at: new Date()
    };
    
    const existing = await db.collection('home_seo').findOne({});
    if (existing) {
      await db.collection('home_seo').updateOne(
        { _id: existing._id },
        { $set: updateData }
      );
    } else {
      await db.collection('home_seo').insertOne({
        ...updateData,
        created_at: new Date()
      });
    }
    
    res.redirect('/admin/home-content?success=SEO settings updated successfully');
  } catch (error) {
    console.error('Update home SEO error:', error);
    res.redirect('/admin/home-content?error=Failed to update SEO');
  }
});

// Warranty Claims routes
router.get('/warranty', checkAdminAuth, async (req, res) => {
  try {
    const { page, status } = req.query;
    const db = getDB();
    const { skip, limit, page: pageNum, perPage } = paginate(page, '20');
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const warranties = await db.collection('warranty_claims')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('warranty_claims').countDocuments(query);
    
    // Populate product and order information
    const warrantiesWithDetails = await Promise.all(warranties.map(async (warranty) => {
      const product = await db.collection('products').findOne({ _id: toObjectId(warranty.product_id) });
      const order = await db.collection('orders').findOne({ _id: toObjectId(warranty.order_id) });
      const user = warranty.user_id ? await db.collection('users').findOne({ _id: toObjectId(warranty.user_id) }) : null;
      
      // Calculate days in warranty
      const daysInWarranty = Math.floor((new Date() - new Date(warranty.created_at)) / (1000 * 60 * 60 * 24));
      
      // Calculate estimated return date
      let estimatedReturnDate = null;
      if (warranty.estimated_days) {
        const returnDate = new Date(warranty.created_at);
        returnDate.setDate(returnDate.getDate() + warranty.estimated_days);
        estimatedReturnDate = returnDate;
      }
      
      return {
        ...warranty,
        id: warranty._id.toString(),
        order_code: order?.order_code || 'N/A',
        product_name: product?.name || 'Product not found',
        product_image: product?.thumbnail_image || null,
        customer_name: user?.name || order?.customer?.name || 'Guest',
        customer_phone: user?.phone || order?.customer?.mobile || 'N/A',
        days_in_warranty: daysInWarranty,
        estimated_return_date: estimatedReturnDate
      };
    }));
    
    res.render('admin/warranty', {
      admin: req.admin,
      warranties: warrantiesWithDetails,
      pagination: buildPaginationMeta(total, pageNum, perPage),
      status: status || '',
      page: 'warranty'
    });
  } catch (error) {
    console.error('Warranty page error:', error);
    res.render('admin/warranty', {
      admin: req.admin,
      warranties: [],
      error: 'Failed to load warranty claims',
      page: 'warranty'
    });
  }
});

// Get single warranty claim (for modal)
router.get('/warranty/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const warranty = await db.collection('warranty_claims').findOne({ _id: toObjectId(id) });
    
    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty claim not found'
      });
    }
    
    const product = await db.collection('products').findOne({ _id: toObjectId(warranty.product_id) });
    const order = await db.collection('orders').findOne({ _id: toObjectId(warranty.order_id) });
    const user = warranty.user_id ? await db.collection('users').findOne({ _id: toObjectId(warranty.user_id) }) : null;
    
    // Calculate days in warranty
    const daysInWarranty = Math.floor((new Date() - new Date(warranty.created_at)) / (1000 * 60 * 60 * 24));
    
    // Calculate estimated return date
    let estimatedReturnDate = null;
    if (warranty.estimated_days) {
      const returnDate = new Date(warranty.created_at);
      returnDate.setDate(returnDate.getDate() + warranty.estimated_days);
      estimatedReturnDate = returnDate;
    }
    
    res.json({
      success: true,
      result: true,
      data: {
        id: warranty._id.toString(),
        order_id: warranty.order_id.toString(),
        order_code: order?.order_code || 'N/A',
        product_id: warranty.product_id.toString(),
        product_name: product?.name || 'Product not found',
        product_image: product?.thumbnail_image || null,
        customer_name: user?.name || order?.customer?.name || 'Guest',
        customer_phone: user?.phone || order?.customer?.mobile || 'N/A',
        issue_description: warranty.issue_description,
        status: warranty.status,
        days_in_warranty: daysInWarranty,
        estimated_days: warranty.estimated_days || null,
        estimated_return_date: estimatedReturnDate,
        admin_notes: warranty.admin_notes || null,
        created_at: warranty.created_at,
        updated_at: warranty.updated_at
      }
    });
  } catch (error) {
    console.error('Get warranty error:', error);
    res.status(500).json({
      success: false,
      result: false,
      message: 'Failed to get warranty claim'
    });
  }
});

// Update warranty claim status and details
router.post('/warranty/:id/update', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimated_days, admin_notes } = req.body;
    const db = getDB();
    
    const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.redirect(`/admin/warranty?error=Invalid status`);
    }
    
    const updateData = {
      updated_at: new Date()
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (estimated_days !== undefined) {
      updateData.estimated_days = estimated_days ? parseInt(estimated_days) : null;
    }
    
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes.trim() || null;
    }
    
    await db.collection('warranty_claims').updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    
    res.redirect('/admin/warranty?success=Warranty claim updated');
  } catch (error) {
    console.error('Update warranty error:', error);
    res.redirect('/admin/warranty?error=Failed to update warranty claim');
  }
});

module.exports = router;
