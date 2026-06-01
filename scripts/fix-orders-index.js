require('dotenv').config();
const { MongoClient } = require('mongodb');

const fixOrdersIndex = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'practicum_db';
    
    if (!uri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('✅ Connected to MongoDB');

    // List all existing indexes
    const indexes = await db.collection('orders').indexes();
    console.log('\n📋 Current indexes on orders collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop old 'code' index if it exists (try both 'code_1' and any index on 'code' field)
    try {
      // Try to drop by name first
      await db.collection('orders').dropIndex('code_1');
      console.log('\n✅ Dropped old code_1 index');
    } catch (e) {
      if (e.code === 27 || e.codeName === 'IndexNotFound') {
        // Index doesn't exist by name, try to find and drop by field
        const codeIndex = indexes.find(idx => idx.key && idx.key.code);
        if (codeIndex) {
          try {
            await db.collection('orders').dropIndex(codeIndex.name);
            console.log(`\n✅ Dropped old index on 'code' field: ${codeIndex.name}`);
          } catch (e2) {
            console.log(`\n⚠️  Could not drop index ${codeIndex.name}: ${e2.message}`);
          }
        } else {
          console.log('\nℹ️  No index on "code" field found (already dropped or never existed)');
        }
      } else {
        console.error('\n⚠️  Error dropping code_1 index:', e.message);
      }
    }

    // Create correct order_code index
    try {
      await db.collection('orders').createIndex({ order_code: 1 }, { unique: true, sparse: true });
      console.log('✅ Created order_code index');
    } catch (e) {
      if (e.code === 85) {
        console.log('ℹ️  order_code index already exists');
      } else {
        console.error('⚠️  Error creating order_code index:', e.message);
      }
    }

    console.log('✅ Orders index fix completed');
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing orders index:', error);
    process.exit(1);
  }
};

fixOrdersIndex();

