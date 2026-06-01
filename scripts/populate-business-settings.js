require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'practicum_db';

// Default business settings data
const defaultSettings = {
  header_logo: '/uploads/logo.png',
  footer_logo: '/uploads/logo.png',
  about_us_description: 'Like Telecom is your trusted partner for premium telecommunications products and services. We offer the latest smartphones, accessories, and innovative tech solutions with exceptional customer service and competitive pricing.',
  frontend_copyright_text: '© 2024 Like Telecom. All rights reserved.',
  contact_phone: '+8801234567890',
  contact_email: 'info@liketelecom.com',
  contact_address: '123 Main Street, Dhaka, Bangladesh',
  facebook_link: 'https://www.facebook.com/liketelecom',
  instagram_link: 'https://www.instagram.com/liketelecom',
  twitter_link: 'https://www.twitter.com/liketelecom',
  youtube_link: 'https://www.youtube.com/liketelecom',
};

async function populateBusinessSettings() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB');
    console.log(`📦 Database: ${db.databaseName}`);
    
    const settingsCollection = db.collection('business_settings');
    
    console.log('\n📝 Populating business settings...\n');
    
    let inserted = 0;
    let updated = 0;
    
    for (const [type, value] of Object.entries(defaultSettings)) {
      const result = await settingsCollection.updateOne(
        { type },
        {
          $set: {
            type,
            value,
            updated_at: new Date()
          },
          $setOnInsert: {
            created_at: new Date()
          }
        },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`✅ Inserted: ${type} = ${value}`);
        inserted++;
      } else if (result.modifiedCount > 0) {
        console.log(`🔄 Updated: ${type} = ${value}`);
        updated++;
      } else {
        console.log(`⏭️  No change: ${type}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully populated business settings!`);
    console.log(`   - Inserted: ${inserted} settings`);
    console.log(`   - Updated: ${updated} settings`);
    console.log('='.repeat(60));
    console.log('\n💡 You can now update these settings from the admin panel:');
    console.log('   http://localhost:5000/admin/settings\n');
    
  } catch (error) {
    console.error('\n❌ Error populating business settings:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.error('\n📋 Troubleshooting:');
      console.error('1. Check if MongoDB is running');
      console.error('2. Verify MONGODB_URI in .env file is correct');
      console.error('3. Check MongoDB Atlas Network Access settings');
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the script
populateBusinessSettings();

