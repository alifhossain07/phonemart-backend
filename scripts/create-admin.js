require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
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
    
    // Get admin details from command line or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@example.com';
    const password = args[1] || 'admin123';
    const name = args[2] || 'Admin User';
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ email, role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      await client.close();
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = {
      name,
      email,
      password: hashedPassword,
      phone: null,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('users').insertOne(admin);
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');
    
    await client.close();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

