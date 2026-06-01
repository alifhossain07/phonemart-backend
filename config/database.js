const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    db = client.db(process.env.DB_NAME || 'practicum_db');
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${db.databaseName}`);
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n📋 Troubleshooting Steps:');
    console.error('1. Check MongoDB Atlas Network Access - Add your IP address');
    console.error('2. Verify MONGODB_URI in .env file is correct');
    console.error('3. Check if MongoDB Atlas cluster is running (free tier may be paused)');
    console.error('4. Verify internet connection');
    console.error('\n⚠️  Server will continue but database operations will fail until connection is established.');
    console.error('💡 Fix the connection issue and restart the server.\n');
    
    // Don't exit - allow server to start but database won't work
    // process.exit(1);
    return null;
  }
};

const createIndexes = async () => {
  try {
    // Users indexes
    // Drop existing email index if it exists (might be non-sparse)
    try {
      const indexes = await db.collection('users').indexes();
      const emailIndex = indexes.find(idx => idx.key && idx.key.email);
      if (emailIndex) {
        await db.collection('users').dropIndex(emailIndex.name);
        console.log(`Dropped existing email index: ${emailIndex.name}`);
      }
    } catch (e) {
      // Index doesn't exist or error dropping, that's fine
    }
    
    // Create sparse unique index on email (only indexes non-null values)
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Wishlists indexes
    await db.collection('wishlists').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('wishlists').createIndex({ 'products': 1 });
    
    // Products indexes
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ category_id: 1 });
    await db.collection('products').createIndex({ brand_id: 1 });
    await db.collection('products').createIndex({ featured: 1 });
    await db.collection('products').createIndex({ published: 1 });
    await db.collection('products').createIndex({ created_at: -1 });
    
    // Categories indexes
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    await db.collection('categories').createIndex({ featured: 1 });
    await db.collection('categories').createIndex({ parent_id: 1 });
    
    // Brands indexes
    await db.collection('brands').createIndex({ slug: 1 }, { unique: true });
    await db.collection('brands').createIndex({ name: 1 });
    await db.collection('brands').createIndex({ selected: 1 });
    
    // Orders indexes
    // Drop old 'code' index if it exists (legacy)
    try {
      const indexes = await db.collection('orders').indexes();
      const codeIndex = indexes.find(idx => idx.key && idx.key.code);
      if (codeIndex) {
        await db.collection('orders').dropIndex(codeIndex.name);
        console.log(`Dropped old ${codeIndex.name} index on 'code' field`);
      }
    } catch (e) {
      // Index doesn't exist or error dropping, that's fine
    }
    
    // Create order_code index (skip if already exists)
    try {
      await db.collection('orders').createIndex({ order_code: 1 }, { unique: true });
    } catch (e) {
      if (e.code !== 85) { // 85 = IndexOptionsConflict, index already exists
        throw e;
      }
    }
    await db.collection('orders').createIndex({ user_id: 1 });
    await db.collection('orders').createIndex({ 'customer.mobile': 1 });
    await db.collection('orders').createIndex({ created_at: -1 });
    
    // Coupons indexes
    await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
    await db.collection('coupons').createIndex({ active: 1 });
    
    // Banners indexes
    await db.collection('banners').createIndex({ position: 1 });
    await db.collection('banners').createIndex({ active: 1 });
    
    // Sliders indexes
    await db.collection('sliders').createIndex({ order: 1 });
    await db.collection('sliders').createIndex({ active: 1 });
    
    // Flash deals indexes
    await db.collection('flash_deals').createIndex({ slug: 1 }, { unique: true });
    await db.collection('flash_deals').createIndex({ status: 1 });
    await db.collection('flash_deals').createIndex({ start_date: 1, end_date: 1 });
    
    // Search suggestions indexes
    await db.collection('search_suggestions').createIndex({ query: 'text' });
    await db.collection('search_suggestions').createIndex({ count: -1 });
    
    // Last viewed products indexes
    await db.collection('last_viewed_products').createIndex({ user_id: 1, product_id: 1 });
    await db.collection('last_viewed_products').createIndex({ viewed_at: -1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Please check MongoDB connection and restart the server.');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

module.exports = connectDB;
module.exports.getDB = getDB;
module.exports.closeDB = closeDB;

