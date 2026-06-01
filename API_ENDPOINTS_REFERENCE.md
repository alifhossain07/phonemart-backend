# 📚 Complete API Endpoints Reference

## Base Information

- **Base URL:** `http://localhost:5000` (or your custom port)
- **API Prefix:** `/api/v2`
- **Required Header:** `System-Key: [your-system-key]` (for most endpoints)

---

## 🔑 How to Get Your System Key

1. Open: `like-telecom-express/.env`
2. Find: `SYSTEM_KEY=...`
3. Copy the value after `=`

**Example:**
```env
SYSTEM_KEY=my-secret-key-12345
```
Use `my-secret-key-12345` as your System-Key header value.

---

## 📍 All Available Endpoints

### 🛍️ Products

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/products/search` | Search products | System-Key |
| GET | `/api/v2/products/:slug` | Get product by slug | System-Key |
| GET | `/api/v2/products/featured` | Get featured products | System-Key |
| GET | `/api/v2/products/new-arrivals` | Get new arrivals | System-Key |
| GET | `/api/v2/products/category/:category` | Get products by category | System-Key |
| GET | `/api/v2/products/earbuds` | Get earbuds | System-Key |
| GET | `/api/v2/products/earphones` | Get earphones | System-Key |
| GET | `/api/v2/products/neckbands` | Get neckbands | System-Key |
| GET | `/api/v2/products/powerbanks` | Get powerbanks | System-Key |
| GET | `/api/v2/products/fast-chargers` | Get fast chargers | System-Key |
| GET | `/api/v2/products/fastcable` | Get fast cables | System-Key |

### 📂 Categories

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/categories` | Get all categories | System-Key |
| GET | `/api/v2/categories/featured` | Get featured categories | System-Key |
| GET | `/api/v2/categories/menu` | Get categories menu (hierarchical) | System-Key |

### 🛡️ Trust Signals

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/trust-signals` | Get trust signals | System-Key |

### 🖼️ Banners & Sliders

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/banners` | Get banners | System-Key |
| GET | `/api/v2/sliders` | Get sliders | System-Key |
| GET | `/api/v2/home-bottom-banner` | Get home bottom banner | System-Key |

### 🛒 Orders

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| POST | `/api/v2/order/checkout` | Create order | System-Key |
| GET | `/api/v2/order/:id` | Get order by ID | System-Key |

### 🎫 Coupons

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| POST | `/api/v2/coupon-apply` | Apply coupon | System-Key |

### ⚡ Flash Deals

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/flash-deals` | Get flash deals | System-Key |

### 📦 Shipping

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/shipping-config` | Get shipping config | System-Key |
| GET | `/api/v2/pickup-list` | Get pickup points | System-Key |

### 🌍 Locations

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/countries` | Get countries | System-Key |
| GET | `/api/v2/states-by-country/:id` | Get states by country | System-Key |
| GET | `/api/v2/states` | Get states | System-Key |

### 🔍 Search

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/get-search-suggestions?query_key=...` | Get search suggestions | System-Key |

### ⚙️ Settings

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| GET | `/api/v2/business-settings` | Get business settings | System-Key |
| GET | `/api/v2/header/logo` | Get header logo | System-Key |
| GET | `/api/v2/home-bottom-info` | Get home bottom info | System-Key |
| GET | `/api/v2/home-bottom-seo` | Get home bottom SEO | System-Key |

### 👤 Authentication

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| POST | `/api/v2/auth/login` | User login | None |
| POST | `/api/v2/auth/signup` | User signup | None |
| GET | `/api/v2/auth/user` | Get user info | System-Key + Authorization (Bearer token) |
| POST | `/api/v2/auth/logout` | Logout | System-Key + Authorization (Bearer token) |

---

## 📝 Postman Collection Setup

### Step 1: Create Environment Variable

In Postman, create an environment with:
- `base_url`: `http://localhost:5000`
- `system_key`: `your-system-key-from-env-file`

### Step 2: Use in Requests

**URL:** `{{base_url}}/api/v2/categories`  
**Header:** `System-Key: {{system_key}}`

---

## 🧪 Quick Test Examples

### Test 1: Get Categories
```
GET http://localhost:5000/api/v2/categories
Header: System-Key: your-key-here
```

### Test 2: Get Trust Signals
```
GET http://localhost:5000/api/v2/trust-signals
Header: System-Key: your-key-here
```

### Test 3: Get Featured Products
```
GET http://localhost:5000/api/v2/products/featured
Header: System-Key: your-key-here
```

### Test 4: Search Products
```
GET http://localhost:5000/api/v2/products/search?name=iphone&page=1
Header: System-Key: your-key-here
```

---

## ✅ Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": [...]
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## 🔒 Security Notes

1. **System-Key:** Required for most endpoints (except auth)
2. **Bearer Token:** Required for user-specific endpoints (like `/auth/user`)
3. **Never expose:** Don't share your System-Key publicly
4. **Production:** Use HTTPS and strong keys in production

