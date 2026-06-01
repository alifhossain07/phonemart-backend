# Categories and Products API Endpoints

This guide shows you how to test category and product endpoints in Postman.

## 🔑 Required Header

All API endpoints require a **System-Key** header (except `/api/v2/auth`):

```
System-Key: your_system_key_here
```

You can find your system key in your `.env` file as `SYSTEM_KEY`.

---

## 📁 Category Endpoints

### 1. Get All Categories

**Endpoint:** `GET /api/v2/categories`

**Headers:**
```
System-Key: your_system_key_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Huawei",
      "slug": "huawei",
      "icon": "...",
      "banner": "...",
      "featured": true,
      "order": 0
    },
    ...
  ]
}
```

**Postman Example:**
```
GET http://localhost:5000/api/v2/categories
Header: System-Key: your_system_key_here
```

---

### 2. Get Featured Categories

**Endpoint:** `GET /api/v2/categories/featured`

**Headers:**
```
System-Key: your_system_key_here
```

**Response:** Same format as above, but only featured categories.

---

### 3. Get Categories Menu (Hierarchical)

**Endpoint:** `GET /api/v2/categories/menu`

**Headers:**
```
System-Key: your_system_key_here
```

**Response:** Returns categories in hierarchical structure with children.

---

## 📦 Product Endpoints

### 1. Get Products by Category Slug

**Endpoint:** `GET /api/v2/products/category/:category`

**Parameters:**
- `category` - Category slug (e.g., `huawei`, `samsung`, `iphone`)

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)

**Headers:**
```
System-Key: your_system_key_here
```

**Examples:**

**Get Huawei products:**
```
GET http://localhost:5000/api/v2/products/category/huawei
Header: System-Key: your_system_key_here
```

**Get Samsung products:**
```
GET http://localhost:5000/api/v2/products/category/samsung
Header: System-Key: your_system_key_here
```

**Get iPhone products with pagination:**
```
GET http://localhost:5000/api/v2/products/category/iphone?page=1&per_page=20
Header: System-Key: your_system_key_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Huawei P60 Pro",
      "slug": "huawei-p60-pro",
      "main_price": 85500,
      "stroked_price": 95000,
      "discount": 10,
      "rating": 0,
      "thumbnail_image": "...",
      "current_stock": 50,
      ...
    },
    ...
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "last_page": 1,
    "has_more_pages": false
  }
}
```

---

### 2. Search Products (Can filter by category)

**Endpoint:** `GET /api/v2/products/search`

**Query Parameters:**
- `name` - Search term (optional)
- `categories` - Comma-separated category IDs (optional)
- `brands` - Comma-separated brand IDs (optional)
- `min` - Minimum price (optional)
- `max` - Maximum price (optional)
- `sort_key` - Sort option: `price_low_to_high`, `price_high_to_low`, `newest`, `oldest`, `rating` (optional)
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)

**Headers:**
```
System-Key: your_system_key_here
```

**Example - Search by category ID:**
```
GET http://localhost:5000/api/v2/products/search?categories=category_id_here
Header: System-Key: your_system_key_here
```

**Example - Search products with price filter:**
```
GET http://localhost:5000/api/v2/products/search?min=50000&max=100000&sort_key=price_low_to_high
Header: System-Key: your_system_key_here
```

---

### 3. Get Featured Products

**Endpoint:** `GET /api/v2/products/featured`

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)

**Headers:**
```
System-Key: your_system_key_here
```

**Example:**
```
GET http://localhost:5000/api/v2/products/featured?page=1&per_page=10
Header: System-Key: your_system_key_here
```

---

### 4. Get Single Product by Slug

**Endpoint:** `GET /api/v2/products/:slug`

**Parameters:**
- `slug` - Product slug (e.g., `huawei-p60-pro`)

**Headers:**
```
System-Key: your_system_key_here
```

**Example:**
```
GET http://localhost:5000/api/v2/products/huawei-p60-pro
Header: System-Key: your_system_key_here
```

**Response:** Full product details including specifications, variants, etc.

---

## 🧪 Complete Postman Testing Guide

### Step 1: Get All Categories

1. **Method:** GET
2. **URL:** `http://localhost:5000/api/v2/categories`
3. **Headers:**
   - Key: `System-Key`
   - Value: `your_system_key_from_env_file`
4. Click **Send**

**Expected Result:** You should see all 8 categories (huawei, samsung, oppo, vivo, iphone, oneplus, realme, xiaomi)

---

### Step 2: Get Category ID

From the response above, copy the `id` of a category (e.g., Huawei). You can use this ID for category-based filtering.

**OR** use the category slug directly in the next step.

---

### Step 3: Get Products by Category Slug

1. **Method:** GET
2. **URL:** `http://localhost:5000/api/v2/products/category/huawei`
   - Replace `huawei` with any category slug: `samsung`, `oppo`, `vivo`, `iphone`, `oneplus`, `realme`, `xiaomi`
3. **Headers:**
   - Key: `System-Key`
   - Value: `your_system_key_from_env_file`
4. Click **Send**

**Expected Result:** You should see all products in that category (should be 1 product per category if you ran the sample products script)

---

### Step 4: Test All Category Slugs

Test each category:

- `http://localhost:5000/api/v2/products/category/huawei`
- `http://localhost:5000/api/v2/products/category/samsung`
- `http://localhost:5000/api/v2/products/category/oppo`
- `http://localhost:5000/api/v2/products/category/vivo`
- `http://localhost:5000/api/v2/products/category/iphone`
- `http://localhost:5000/api/v2/products/category/oneplus`
- `http://localhost:5000/api/v2/products/category/realme`
- `http://localhost:5000/api/v2/products/category/xiaomi`

---

## 📝 Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/categories` | GET | Get all categories |
| `/api/v2/categories/featured` | GET | Get featured categories |
| `/api/v2/categories/menu` | GET | Get hierarchical category menu |
| `/api/v2/products/category/:category` | GET | Get products by category slug |
| `/api/v2/products/search` | GET | Search/filter products |
| `/api/v2/products/featured` | GET | Get featured products |
| `/api/v2/products/:slug` | GET | Get single product details |

---

## ⚠️ Common Issues

### 401 Unauthorized
- **Problem:** Missing or incorrect System-Key header
- **Solution:** Check your `.env` file for `SYSTEM_KEY` and add it to Postman headers

### 404 Not Found
- **Problem:** Category slug doesn't exist
- **Solution:** Check available categories using `/api/v2/categories` endpoint

### Empty Results
- **Problem:** No products in that category
- **Solution:** Make sure products exist and are published (`published: true`)

---

## 🎯 Testing Checklist

- [ ] Get all categories
- [ ] Get products for Huawei category
- [ ] Get products for Samsung category
- [ ] Get products for iPhone category
- [ ] Test pagination with `page` and `per_page` parameters
- [ ] Test search endpoint with category filter
- [ ] Test featured products endpoint
- [ ] Test single product by slug

