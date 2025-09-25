const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📍 Database URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

    // Get database instance
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log('🗄️  Database Name:', dbName);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    
    if (collections.length === 0) {
      console.log('❌ No collections found in the database');
    } else {
      for (const collection of collections) {
        console.log(`  - ${collection.name}`);
        
        // Count documents in each collection
        const count = await db.collection(collection.name).countDocuments();
        console.log(`    📊 Documents: ${count}`);
        
        // Show sample documents if any exist
        if (count > 0) {
          const sample = await db.collection(collection.name).findOne();
          console.log(`    📄 Sample document:`, JSON.stringify(sample, null, 2));
        }
        console.log('');
      }
    }

    // Check specific collections we expect
    console.log('\n🔍 Checking expected collections:');
    const expectedCollections = ['users', 'accessrequests', 'messages'];
    
    for (const collectionName of expectedCollections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      const count = exists ? await db.collection(collectionName).countDocuments() : 0;
      console.log(`  ${exists ? '✅' : '❌'} ${collectionName}: ${exists ? `${count} documents` : 'does not exist'}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
};

checkDatabase();