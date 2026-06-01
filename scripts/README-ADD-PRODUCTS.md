# Add Sample Products Script

This script adds one sample product for each of the 8 smartphone categories:
- Huawei
- Samsung  
- Oppo
- Vivo
- iPhone
- OnePlus
- Realme
- Xiaomi

## Prerequisites

1. Make sure your MongoDB connection is configured in `.env` file:
   ```
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=practicum_db
   ```

2. Ensure the categories exist in your database with these slugs:
   - `huawei`
   - `samsung`
   - `oppo`
   - `vivo`
   - `iphone`
   - `oneplus`
   - `realme`
   - `xiaomi`

## How to Run

From the `like-telecom-express` directory, run:

```bash
node scripts/add-sample-products.js
```

Or if you're in the root directory:

```bash
cd like-telecom-express
node scripts/add-sample-products.js
```

## What the Script Does

1. Connects to your MongoDB database
2. Finds each category by slug
3. Creates a realistic smartphone product for each category with:
   - Product name, description
   - Base price and discount (percentage or flat)
   - Complete specifications (display, processor, battery, camera, etc.)
   - Color options
   - Storage and region options
   - Stock information
   - Statistics (viewing count, units sold)

## Important Notes

- **Thumbnail Image**: The script sets `thumbnail_image` to `null`. You must manually add the thumbnail image URL for each product through the admin panel after running this script.

- **Duplicate Prevention**: The script checks if a product with the same name already exists and skips it if found.

- **Category Verification**: The script will skip categories that don't exist in the database.

## Products Added

Each product includes realistic specifications based on current smartphone models:

1. **Huawei P60 Pro** - ৳95,000 (10% discount)
2. **Samsung Galaxy S24 Ultra** - ৳145,000 (8% discount)
3. **OPPO Find X7 Ultra** - ৳98,000 (৳5,000 flat discount)
4. **Vivo X100 Pro** - ৳89,000 (12% discount)
5. **iPhone 15 Pro Max** - ৳165,000 (no discount)
6. **OnePlus 12** - ৳85,000 (15% discount)
7. **Realme GT 5 Pro** - ৳65,000 (৳3,000 flat discount)
8. **Xiaomi 14 Ultra** - ৳125,000 (10% discount)

## After Running the Script

1. Go to your admin panel: `/admin/products`
2. Find each newly added product
3. Edit each product to add the thumbnail image URL
4. Verify all product information is correct

## Troubleshooting

If you encounter errors:

1. **Connection Error**: Check your MongoDB URI in `.env` file
2. **Category Not Found**: Ensure categories with the correct slugs exist in the database
3. **Duplicate Product**: The script will skip products that already exist

