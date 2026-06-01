require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { generateSlug } = require('../utils/helpers');

// Product data for each category
const productData = {
  huawei: {
    name: 'Huawei P60 Pro',
    base_price: 95000,
    discount_type: 'percentage',
    discount_value: 10,
    description: 'The Huawei P60 Pro features a stunning 6.67-inch OLED display with 120Hz refresh rate, powered by Snapdragon 8+ Gen 1 processor. Features advanced triple camera system with 50MP main sensor, 48MP telephoto, and 13MP ultra-wide. Comes with 256GB storage and 8GB RAM.',
    basic_specs: {
      display: '6.67" OLED, 120Hz, HDR10+',
      processor: 'Snapdragon 8+ Gen 1',
      battery: '4815 mAh, 88W SuperCharge, 50W Wireless',
      camera: 'Triple Camera: 50MP Main, 48MP Telephoto, 13MP Ultra-wide',
      others: '5G, IP68, HarmonyOS 3.0, In-display Fingerprint'
    },
    colors: ['#000000', '#FFFFFF', '#FF6B6B'],
    storage_options: '256GB, 512GB',
    region_options: 'Global, China',
    current_stock: 50,
    viewing_count: 1250,
    units_sold: 45
  },
  samsung: {
    name: 'Samsung Galaxy S24 Ultra',
    base_price: 145000,
    discount_type: 'percentage',
    discount_value: 8,
    description: 'The Samsung Galaxy S24 Ultra is a flagship powerhouse with 6.8-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 chipset, and revolutionary 200MP camera system. Features S Pen support, 5000mAh battery with 45W fast charging, and 256GB base storage.',
    basic_specs: {
      display: '6.8" Dynamic AMOLED 2X, 120Hz, 1750 nits',
      processor: 'Snapdragon 8 Gen 3',
      battery: '5000 mAh, 45W Fast Charging, 15W Wireless',
      camera: 'Quad Camera: 200MP Main, 50MP Telephoto, 12MP Ultra-wide, 10MP Periscope',
      others: '5G, IP68, S Pen, One UI 6.0, Ultrasonic Fingerprint'
    },
    colors: ['#000000', '#8B4513', '#4169E1'],
    storage_options: '256GB, 512GB, 1TB',
    region_options: 'Global, USA, Europe',
    current_stock: 75,
    viewing_count: 3450,
    units_sold: 120
  },
  oppo: {
    name: 'OPPO Find X7 Ultra',
    base_price: 98000,
    discount_type: 'flat',
    discount_value: 5000,
    description: 'OPPO Find X7 Ultra boasts a premium 6.82-inch LTPO AMOLED display, MediaTek Dimensity 9300 chipset, and exceptional dual periscope camera system. Features 5000mAh battery with 100W SuperVOOC charging and advanced portrait photography capabilities.',
    basic_specs: {
      display: '6.82" LTPO AMOLED, 120Hz, 4500 nits peak brightness',
      processor: 'MediaTek Dimensity 9300',
      battery: '5000 mAh, 100W SuperVOOC, 50W Wireless',
      camera: 'Quad Camera: 50MP Main, 50MP Telephoto, 50MP Periscope, 50MP Ultra-wide',
      others: '5G, IP68, ColorOS 14, Under-display Fingerprint, Hasselblad Tuning'
    },
    colors: ['#1A1A1A', '#D4AF37', '#8B0000'],
    storage_options: '256GB, 512GB',
    region_options: 'Global, China, India',
    current_stock: 60,
    viewing_count: 2100,
    units_sold: 85
  },
  vivo: {
    name: 'Vivo X100 Pro',
    base_price: 89000,
    discount_type: 'percentage',
    discount_value: 12,
    description: 'Vivo X100 Pro features a beautiful 6.78-inch AMOLED display, MediaTek Dimensity 9300 chipset, and outstanding camera system with ZEISS optics. Includes 5400mAh battery with 100W fast charging and 50W wireless charging support.',
    basic_specs: {
      display: '6.78" AMOLED, 120Hz, HDR10+',
      processor: 'MediaTek Dimensity 9300',
      battery: '5400 mAh, 100W FlashCharge, 50W Wireless',
      camera: 'Triple Camera: 50MP VCS Main, 64MP Telephoto, 50MP Ultra-wide (ZEISS)',
      others: '5G, IP68, OriginOS 4, In-display Fingerprint, ZEISS T* Coating'
    },
    colors: ['#000000', '#FFD700', '#FF1493'],
    storage_options: '256GB, 512GB, 1TB',
    region_options: 'Global, China',
    current_stock: 55,
    viewing_count: 1800,
    units_sold: 70
  },
  iphone: {
    name: 'iPhone 15 Pro Max',
    base_price: 165000,
    discount_type: null,
    discount_value: null,
    description: 'The iPhone 15 Pro Max features a stunning 6.7-inch Super Retina XDR display, revolutionary A17 Pro chip, and advanced camera system with 5x optical zoom. Made from aerospace-grade titanium, includes USB-C, and supports Action Button customization.',
    basic_specs: {
      display: '6.7" Super Retina XDR OLED, ProMotion 120Hz',
      processor: 'Apple A17 Pro (3nm)',
      battery: '4441 mAh, 27W Fast Charging, 15W MagSafe Wireless',
      camera: 'Triple Camera: 48MP Main, 12MP Telephoto (5x), 12MP Ultra-wide',
      others: '5G, IP68, iOS 17, Face ID, USB-C, Action Button, Titanium Build'
    },
    colors: ['#1C1C1E', '#FFFFFF', '#007AFF', '#FF3B30'],
    storage_options: '256GB, 512GB, 1TB',
    region_options: 'Global, USA, Europe, Asia',
    current_stock: 100,
    viewing_count: 8900,
    units_sold: 350
  },
  oneplus: {
    name: 'OnePlus 12',
    base_price: 85000,
    discount_type: 'percentage',
    discount_value: 15,
    description: 'OnePlus 12 delivers flagship performance with 6.82-inch LTPO AMOLED display, Snapdragon 8 Gen 3, and 5400mAh battery with 100W SuperVOOC. Features 50MP triple camera system with Hasselblad tuning and Alert Slider.',
    basic_specs: {
      display: '6.82" LTPO AMOLED, 120Hz, 4500 nits peak',
      processor: 'Snapdragon 8 Gen 3',
      battery: '5400 mAh, 100W SuperVOOC, 50W Wireless',
      camera: 'Triple Camera: 50MP Main, 64MP Periscope, 48MP Ultra-wide (Hasselblad)',
      others: '5G, IP65, OxygenOS 14, In-display Fingerprint, Alert Slider'
    },
    colors: ['#000000', '#8B0000', '#FFD700'],
    storage_options: '256GB, 512GB',
    region_options: 'Global, India, China',
    current_stock: 65,
    viewing_count: 2750,
    units_sold: 95
  },
  realme: {
    name: 'Realme GT 5 Pro',
    base_price: 65000,
    discount_type: 'flat',
    discount_value: 3000,
    description: 'Realme GT 5 Pro offers exceptional value with 6.78-inch AMOLED display, Snapdragon 8 Gen 3, and 5400mAh battery with 100W SuperVOOC charging. Features 50MP triple camera with periscope telephoto lens.',
    basic_specs: {
      display: '6.78" AMOLED, 120Hz, HDR10+',
      processor: 'Snapdragon 8 Gen 3',
      battery: '5400 mAh, 100W SuperVOOC, 50W Wireless',
      camera: 'Triple Camera: 50MP Main, 8MP Periscope, 8MP Ultra-wide',
      others: '5G, IP64, Realme UI 5.0, In-display Fingerprint'
    },
    colors: ['#FF6B35', '#2D3142', '#FFFFFF'],
    storage_options: '256GB, 512GB',
    region_options: 'Global, India, China',
    current_stock: 80,
    viewing_count: 3200,
    units_sold: 150
  },
  xiaomi: {
    name: 'Xiaomi 14 Ultra',
    base_price: 125000,
    discount_type: 'percentage',
    discount_value: 10,
    description: 'Xiaomi 14 Ultra features a premium 6.73-inch LTPO AMOLED display, Snapdragon 8 Gen 3, and Leica-tuned quad camera system. Includes 5300mAh battery with 90W HyperCharge and 50W wireless charging.',
    basic_specs: {
      display: '6.73" LTPO AMOLED, 120Hz, 3000 nits peak',
      processor: 'Snapdragon 8 Gen 3',
      battery: '5300 mAh, 90W HyperCharge, 50W Wireless',
      camera: 'Quad Camera: 50MP Main, 50MP Telephoto, 50MP Periscope, 50MP Ultra-wide (Leica)',
      others: '5G, IP68, MIUI 15, In-display Fingerprint, Leica Summilux Lens'
    },
    colors: ['#000000', '#8B4513', '#1E90FF'],
    storage_options: '512GB, 1TB',
    region_options: 'Global, China, India',
    current_stock: 70,
    viewing_count: 4100,
    units_sold: 180
  }
};

async function addSampleProducts() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'practicum_db';
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const categoriesCollection = db.collection('categories');
    const productsCollection = db.collection('products');
    
    const categorySlugs = ['huawei', 'samsung', 'oppo', 'vivo', 'iphone', 'oneplus', 'realme', 'xiaomi'];
    
    console.log('\n📋 Processing categories...\n');
    
    for (const slug of categorySlugs) {
      // Find category by slug
      const category = await categoriesCollection.findOne({ slug });
      
      if (!category) {
        console.log(`⚠️  Category "${slug}" not found. Skipping...`);
        continue;
      }
      
      const productInfo = productData[slug];
      if (!productInfo) {
        console.log(`⚠️  Product data for "${slug}" not found. Skipping...`);
        continue;
      }
      
      // Check if product already exists
      const productSlug = generateSlug(productInfo.name);
      const existingProduct = await productsCollection.findOne({ slug: productSlug });
      
      if (existingProduct) {
        console.log(`⏭️  Product "${productInfo.name}" already exists. Skipping...`);
        continue;
      }
      
      // Parse colors
      const colorsArray = productInfo.colors || [];
      
      // Parse choice options
      const choice_options = [];
      if (productInfo.storage_options) {
        const storageOpts = productInfo.storage_options.split(',').map(o => o.trim()).filter(Boolean);
        if (storageOpts.length > 0) {
          choice_options.push({
            name: 'storage',
            title: 'Storage',
            options: storageOpts
          });
        }
      }
      if (productInfo.region_options) {
        const regionOpts = productInfo.region_options.split(',').map(o => o.trim()).filter(Boolean);
        if (regionOpts.length > 0) {
          choice_options.push({
            name: 'region',
            title: 'Region',
            options: regionOpts
          });
        }
      }
      
      // Create product document
      const product = {
        name: productInfo.name,
        slug: productSlug,
        description: productInfo.description || '',
        category_id: new ObjectId(category._id),
        base_price: productInfo.base_price,
        discount_type: productInfo.discount_type || null,
        discount_value: productInfo.discount_value || null,
        current_stock: productInfo.current_stock || 0,
        featured: true,
        published: true,
        thumbnail_image: null, // User will provide this
        images: [],
        photos: [],
        specifications: [],
        featured_specs: [],
        basic_specs: productInfo.basic_specs || null,
        colors: colorsArray,
        choice_options: choice_options,
        variants: [],
        product_compatible: [],
        viewing_count: productInfo.viewing_count || 0,
        units_sold: productInfo.units_sold || 0,
        rating: 0,
        sales: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Insert product
      const result = await productsCollection.insertOne(product);
      console.log(`✅ Added: ${productInfo.name} (ID: ${result.insertedId})`);
      console.log(`   Category: ${category.name} | Base Price: ৳${productInfo.base_price}`);
      if (productInfo.discount_type) {
        const discountText = productInfo.discount_type === 'percentage' 
          ? `${productInfo.discount_value}%` 
          : `৳${productInfo.discount_value}`;
        console.log(`   Discount: ${discountText} (${productInfo.discount_type})`);
      }
      console.log('');
    }
    
    console.log('✨ Sample products added successfully!');
    console.log('\n📝 Note: Remember to add thumbnail_image URLs for each product in the admin panel.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
addSampleProducts();

