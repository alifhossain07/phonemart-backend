# Like Telecom Backend - Express + MongoDB

A complete Express.js + MongoDB backend for the Like Telecom e-commerce platform with a built-in admin panel.

## 🚀 Quick Start

**For detailed step-by-step setup instructions, see [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**

### Quick Setup (5 minutes):

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
   DB_NAME=practicum_db
   JWT_SECRET=your-jwt-secret-here
   SYSTEM_KEY=your-system-key-here
   ```

3. **Create admin user:**
   ```bash
   npm run create-admin
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

5. **Access:**
   - API: http://localhost:5000/api/v2
   - Admin: http://localhost:5000/admin

---

## Features

- ✅ RESTful API endpoints for frontend
- ✅ Admin Panel with Tailwind CSS UI
- ✅ MongoDB Atlas integration
- ✅ JWT Authentication
- ✅ Product Management
- ✅ Category Management
- ✅ Brand Management
- ✅ Order Management
- ✅ Coupon System
- ✅ Flash Deals
- ✅ Search Functionality
- ✅ Location Management (Countries, States, Cities, Areas)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd like-telecom-backend-new
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   PORT=5000
   NODE_ENV=development

   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://alif_iubat_practicum:RLNdrbIRM07ZvG8H@basicsexploring.cgr22.mongodb.net/?appName=basicsExploring
   DB_NAME=practicum_db

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # System Key (for API authentication)
   SYSTEM_KEY=your-system-key-here-change-this
   ```

   **Important:** Change `JWT_SECRET` and `SYSTEM_KEY` to secure random strings in production!

5. **Create an admin user:**
   
   You need to create an admin user in MongoDB. You can do this by:
   
   - Using MongoDB Compass or MongoDB Atlas UI
   - Or running a script (see below)

   Create a user in the `users` collection with:
   ```json
   {
     "name": "Admin User",
     "email": "admin@example.com",
     "password": "<hashed_password>",
     "role": "admin",
     "created_at": new Date(),
     "updated_at": new Date()
   }
   ```

   To hash the password, you can use Node.js:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hashedPassword = await bcrypt.hash('your-admin-password', 10);
   console.log(hashedPassword);
   ```

   Or use this quick script:
   ```bash
   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"
   ```

## Running the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## Access Points

- **API Base URL:** `http://localhost:5000/api/v2`
- **Admin Panel:** `http://localhost:5000/admin`
- **Health Check:** `http://localhost:5000/health`

## API Endpoints

All API endpoints require the `System-Key` header (except auth endpoints).

### Authentication
- `POST /api/v2/auth/login` - User login
- `POST /api/v2/auth/signup` - User signup
- `GET /api/v2/auth/user` - Get user info (requires Bearer token)
- `POST /api/v2/auth/info` - Get user info by token
- `GET /api/v2/auth/logout` - Logout

### Products
- `GET /api/v2/products/:slug` - Get product by slug
- `GET /api/v2/products/search` - Search products
- `GET /api/v2/products/category/:category` - Get products by category
- `GET /api/v2/products/featureproducts` - Get featured products
- `GET /api/v2/products/new-arrivals` - Get new arrivals
- `GET /api/v2/products/flashsale` - Get flash sale products
- `GET /api/v2/products/earbuds` - Get earbuds
- `GET /api/v2/products/earphones` - Get earphones
- `GET /api/v2/products/neckbands` - Get neckbands
- `GET /api/v2/products/powerbanks` - Get powerbanks
- `GET /api/v2/products/fast-chargers` - Get fast chargers
- `GET /api/v2/products/fastcable` - Get fast cables

### Categories
- `GET /api/v2/categories` - Get all categories
- `GET /api/v2/categories/featured` - Get featured categories

### Brands
- `GET /api/v2/brand-categories` - Get selected brands

### Banners
- `GET /api/v2/banners` - Get banners
- `GET /api/v2/sliders` - Get sliders
- `GET /api/v2/home-bottom-banner` - Get home bottom banner

### Orders
- `POST /api/v2/order/checkout` - Create order
- `GET /api/v2/order/:id` - Get order by ID

### Coupons
- `POST /api/v2/coupon-apply` - Apply coupon

### Flash Deals
- `GET /api/v2/flash-deals` - Get active flash deals
- `GET /api/v2/flash-deals/info/:slug` - Get flash deal info

### Shipping
- `GET /api/v2/shipping-config` - Get shipping configuration
- `GET /api/v2/pickup-list` - Get pickup points

### Locations
- `GET /api/v2/countries` - Get countries
- `GET /api/v2/states-by-country/:id` - Get states by country
- `GET /api/v2/states` - Get states (for areas)

### Search
- `GET /api/v2/get-search-suggestions?query_key=...` - Get search suggestions

## Admin Panel

### Login
1. Navigate to `http://localhost:5000/admin/login`
2. Enter admin email and password
3. You'll be redirected to the dashboard

### Admin Features
- **Dashboard:** View statistics and quick actions
- **Products:** Add, edit, delete products
- **Categories:** Manage product categories
- **Brands:** Manage brands
- **Orders:** View and manage orders

## Database Collections

The following collections are used:
- `users` - User accounts (customers and admins)
- `products` - Product catalog
- `categories` - Product categories
- `brands` - Product brands
- `orders` - Customer orders
- `coupons` - Discount coupons
- `banners` - Homepage banners
- `sliders` - Homepage sliders
- `flash_deals` - Flash sale deals
- `shipping_config` - Shipping configuration
- `pickup_points` - Pickup point locations
- `countries` - Country list
- `states` - State/Province list
- `cities` - City list
- `areas` - Area list
- `search_suggestions` - Search suggestions
- `last_viewed_products` - User product view history

## Frontend Integration

Update your Next.js frontend `.env.local`:
```env
API_BASE=http://localhost:5000
SYSTEM_KEY=your-system-key-here-change-this
```

**Important:** The `API_BASE` should be just the base URL (without `/api/v2`). The frontend automatically adds `/api/v2` to construct the full API endpoint URLs.

## Security Notes

1. **Change default secrets:** Always change `JWT_SECRET` and `SYSTEM_KEY` in production
2. **Use HTTPS:** Always use HTTPS in production
3. **Environment variables:** Never commit `.env` file to version control
4. **Admin access:** Restrict admin panel access to trusted IPs in production

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB Atlas connection string
- Check network access in MongoDB Atlas (IP whitelist)
- Verify database name matches `DB_NAME` in `.env`

### Admin Login Not Working
- Verify admin user exists in database
- Check password is properly hashed with bcrypt
- Verify user has `role: "admin"` in database

### API Returns 401
- Check `System-Key` header is included in requests
- Verify `SYSTEM_KEY` in `.env` matches the header value

## Development

### Project Structure
```
like-telecom-backend-new/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── systemKey.js          # System key validation
├── routes/
│   ├── admin.js             # Admin panel routes
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── categories.js        # Category routes
│   ├── brands.js            # Brand routes
│   ├── banners.js           # Banner routes
│   ├── orders.js            # Order routes
│   ├── coupons.js           # Coupon routes
│   ├── flashDeals.js        # Flash deal routes
│   ├── shipping.js          # Shipping routes
│   ├── locations.js         # Location routes
│   └── search.js            # Search routes
├── utils/
│   └── helpers.js           # Helper functions
├── views/
│   └── admin/               # Admin panel views (EJS)
├── server.js                 # Main server file
└── package.json
```

## License

ISC

## Support

For issues or questions, please check the codebase or create an issue in your repository.

