# 🚀 Postman API Testing Guide

## Quick Reference

**Base URL:** `http://localhost:5000`  
**API Prefix:** `/api/v2`  
**Required Header:** `System-Key: your-system-key-here`

---

## 📋 How to Test in Postman

### Step 1: Get Your System Key

1. Open your Express backend `.env` file: `like-telecom-express/.env`
2. Find the `SYSTEM_KEY` value
3. Copy it (you'll need it for the header)

### Step 2: Set Up Postman Request

**Method:** GET (or POST for some endpoints)  
**URL:** `http://localhost:5000/api/v2/[endpoint]`  
**Headers:**
```
System-Key: your-system-key-from-env-file
Accept: application/json
```

---

## 🔗 API Endpoints Examples

### 1. Get All Categories

**Request:**
```
GET http://localhost:5000/api/v2/categories
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "Earbuds",
      "slug": "earbuds",
      "icon": "icon-url",
      "banner": "banner-url",
      "featured": true
    }
  ]
}
```

---

### 2. Get Featured Categories

**Request:**
```
GET http://localhost:5000/api/v2/categories/featured
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

---

### 3. Get Trust Signals

**Request:**
```
GET http://localhost:5000/api/v2/trust-signals
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "Free Shipping",
      "icon": "icon-url",
      "description": "Free shipping on orders over $50"
    }
  ]
}
```

---

### 4. Get All Products

**Request:**
```
GET http://localhost:5000/api/v2/products/search
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

**Query Parameters (optional):**
- `name`: Search term
- `page`: Page number
- `per_page`: Items per page
- `min`: Minimum price
- `max`: Maximum price

**Example:**
```
GET http://localhost:5000/api/v2/products/search?name=iphone&page=1&per_page=10
```

---

### 5. Get Product by Slug

**Request:**
```
GET http://localhost:5000/api/v2/products/apple-iphone-16-pro-max-ctfje
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

---

### 6. Get Banners

**Request:**
```
GET http://localhost:5000/api/v2/banners
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

---

### 7. Get Sliders

**Request:**
```
GET http://localhost:5000/api/v2/sliders
```

**Headers:**
```
System-Key: your-system-key-here
Accept: application/json
```

---

## 🔐 Authentication Endpoints (No System-Key Required)

### Login

**Request:**
```
POST http://localhost:5000/api/v2/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "login_by": "phone",
  "phone": "01712345678",
  "password": "userpassword"
}
```

---

### Get User Info (Requires Bearer Token)

**Request:**
```
GET http://localhost:5000/api/v2/auth/user
```

**Headers:**
```
System-Key: your-system-key-here
Authorization: Bearer your-jwt-token-here
Accept: application/json
```

---

## 📝 Complete API Endpoint List

### Products
- `GET /api/v2/products/search` - Search products
- `GET /api/v2/products/:slug` - Get product by slug
- `GET /api/v2/products/featured` - Get featured products
- `GET /api/v2/products/new-arrivals` - Get new arrivals
- `GET /api/v2/products/category/:category` - Get products by category
- `GET /api/v2/products/earbuds` - Get earbuds
- `GET /api/v2/products/earphones` - Get earphones
- `GET /api/v2/products/neckbands` - Get neckbands
- `GET /api/v2/products/powerbanks` - Get powerbanks
- `GET /api/v2/products/fast-chargers` - Get fast chargers
- `GET /api/v2/products/fastcable` - Get fast cables

### Categories
- `GET /api/v2/categories` - Get all categories
- `GET /api/v2/categories/featured` - Get featured categories
- `GET /api/v2/categories/menu` - Get categories menu (hierarchical)

### Trust Signals
- `GET /api/v2/trust-signals` - Get trust signals

### Banners
- `GET /api/v2/banners` - Get banners
- `GET /api/v2/sliders` - Get sliders
- `GET /api/v2/home-bottom-banner` - Get home bottom banner

### Orders
- `POST /api/v2/order/checkout` - Create order
- `GET /api/v2/order/:id` - Get order by ID

### Locations
- `GET /api/v2/countries` - Get countries
- `GET /api/v2/states-by-country/:id` - Get states by country
- `GET /api/v2/states` - Get states

### Other
- `GET /api/v2/flash-deals` - Get flash deals
- `GET /api/v2/shipping-config` - Get shipping config
- `GET /api/v2/pickup-list` - Get pickup points
- `GET /api/v2/business-settings` - Get business settings
- `GET /api/v2/header/logo` - Get header logo
- `GET /api/v2/home-bottom-info` - Get home bottom info
- `GET /api/v2/home-bottom-seo` - Get home bottom SEO
- `GET /api/v2/get-search-suggestions?query_key=...` - Get search suggestions
- `POST /api/v2/coupon-apply` - Apply coupon

---

## ⚠️ Important Notes

1. **System-Key Header:** Most endpoints require `System-Key` header (except auth endpoints)
2. **Header Name:** Use `System-Key` (with capital S and K, hyphen)
3. **Port:** Default is `5000`, but check your `.env` file if you changed it
4. **Response Format:** All responses follow this format:
   ```json
   {
     "success": true,
     "data": [...]
   }
   ```

---

## 🧪 Testing Checklist

- [ ] Express backend is running (`npm run dev` in `like-telecom-express`)
- [ ] Backend shows: `🚀 Server running on port 5000`
- [ ] You have the `SYSTEM_KEY` from backend `.env` file
- [ ] Postman request includes `System-Key` header
- [ ] URL format: `http://localhost:5000/api/v2/[endpoint]`

---

## 🔍 Example: Testing Categories in Postman

1. **Open Postman**
2. **Create New Request:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/v2/categories`
3. **Go to Headers tab:**
   - Key: `System-Key`
   - Value: `your-system-key-from-env` (copy from `like-telecom-express/.env`)
   - Key: `Accept`
   - Value: `application/json`
4. **Click Send**
5. **You should see:**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "...",
         "name": "...",
         "slug": "..."
       }
     ]
   }
   ```

---

## 🎯 Quick Comparison

**Old Laravel:**
```
GET like.test/api/v2/trust-signals
Headers: System-Key: ...
```

**New Express:**
```
GET http://localhost:5000/api/v2/trust-signals
Headers: System-Key: ...
```

**Same structure, just different base URL!**

