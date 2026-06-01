require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

const app = express();

// Trust proxy (important for Digital Ocean and reverse proxies)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(cookieParser());

// Stripe webhook needs raw body - register BEFORE express.json()
app.use('/api/v2/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripeWebhook'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine for admin panel
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
connectDB();

// API Routes (with System Key middleware)
const systemKeyMiddleware = require('./middleware/systemKey');
const authMiddleware = require('./middleware/auth');

// Public API routes (require System-Key header)
app.use('/api/v2/auth', require('./routes/auth'));
app.use('/api/v2/user', systemKeyMiddleware, authMiddleware, require('./routes/user'));
app.use('/api/v2/wishlist', systemKeyMiddleware, authMiddleware, require('./routes/wishlist'));
app.use('/api/v2/warranty', systemKeyMiddleware, authMiddleware, require('./routes/warranty'));
app.use('/api/v2/products', systemKeyMiddleware, require('./routes/products'));
app.use('/api/v2/categories', systemKeyMiddleware, require('./routes/categories'));
app.use('/api/v2/brand-categories', systemKeyMiddleware, require('./routes/brands'));
app.use('/api/v2/banners', systemKeyMiddleware, require('./routes/banners'));
app.use('/api/v2/sliders', systemKeyMiddleware, require('./routes/sliders'));
app.use('/api/v2/home-bottom-banner', systemKeyMiddleware, require('./routes/newsletterBanner'));
app.use('/api/v2/order', systemKeyMiddleware, require('./routes/orders'));
// Stripe webhook is registered above with raw body parser (no system key middleware)
// Other Stripe routes need system key
app.use('/api/v2/stripe', systemKeyMiddleware, require('./routes/stripe'));
app.use('/api/v2/coupon-apply', systemKeyMiddleware, require('./routes/coupons'));
app.use('/api/v2/flash-deals', systemKeyMiddleware, require('./routes/flashDeals'));
app.use('/api/v2/shipping-config', systemKeyMiddleware, require('./routes/shipping'));
app.use('/api/v2/pickup-list', systemKeyMiddleware, require('./routes/shipping'));
app.use('/api/v2/countries', systemKeyMiddleware, require('./routes/locations'));
app.use('/api/v2/states-by-country', systemKeyMiddleware, require('./routes/locations'));
app.use('/api/v2/states', systemKeyMiddleware, require('./routes/locations'));
app.use('/api/v2/get-search-suggestions', systemKeyMiddleware, require('./routes/search'));
app.use('/api/v2/business-settings', systemKeyMiddleware, require('./routes/businessSettings'));
app.use('/api/v2/header', systemKeyMiddleware, require('./routes/header'));
app.use('/api/v2/trust-signals', systemKeyMiddleware, require('./routes/trustSignals'));
app.use('/api/v2/marquee', systemKeyMiddleware, require('./routes/marquee'));
app.use('/api/v2/search', systemKeyMiddleware, require('./routes/search'));
app.use('/api/v2', systemKeyMiddleware, require('./routes/homeInfo')); // home-bottom-info and home-bottom-seo

// Admin Panel Routes
app.use('/admin', require('./routes/admin'));

// Root route - redirect to admin panel or show info
app.get('/', (req, res) => {
  // Check if user has admin token
  const token = req.cookies?.admin_token;
  if (token) {
    return res.redirect('/admin/dashboard');
  }
  // Otherwise redirect to login
  res.redirect('/admin/login');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 handler - check if API route or admin route
app.use((req, res) => {
  // If it's an API request, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  // If it's an admin route that doesn't exist, redirect to login
  if (req.path.startsWith('/admin')) {
    return res.redirect('/admin/login');
  }
  // For all other routes, redirect to admin login
  res.redirect('/admin/login');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API Base URL: http://localhost:${PORT}/api/v2`);
  console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
});

