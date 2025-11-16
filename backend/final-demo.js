#!/usr/bin/env node

/**
 * 🍭 Sweet Shop - Complete SQLite Database & Full-Stack Demo
 * 
 * This script demonstrates the complete Sweet Shop application
 * with SQLite database, premium UI, and comprehensive testing.
 */

const database = require('./config/database');
const Sweet = require('./models/Sweet');
const User = require('./models/User');

async function runCompleteDemo() {
  console.log('🍭 Sweet Shop - Complete System Demo');
  console.log('=====================================\n');

  try {
    // 1. Database Connection & Setup
    console.log('📊 1. SQLite Database Setup');
    console.log('---------------------------');
    await database.connect();
    console.log('✅ SQLite database connected successfully');
    
    // Create tables
    await database.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await database.run(`CREATE TABLE IF NOT EXISTS sweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER DEFAULT 0,
      description TEXT,
      image_url VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await database.run(`CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sweet_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (sweet_id) REFERENCES sweets(id)
    )`);
    
    console.log('✅ Database tables created/verified');

    // 2. User Management Demo
    console.log('\n👤 2. User Management');
    console.log('---------------------');
    
    let demoUser;
    try {
      demoUser = await User.create({
        email: 'customer@sweetshop.com',
        password: 'sweet123',
        role: 'user'
      });
      console.log(`✅ Created customer: ${demoUser.email}`);
    } catch (error) {
      demoUser = await User.findByEmail('customer@sweetshop.com');
      console.log(`ℹ️  Using existing customer: ${demoUser.email}`);
    }

    // 3. Sweet Inventory Demo
    console.log('\n🍬 3. Sweet Inventory Management');
    console.log('--------------------------------');
    
    const premiumSweets = [
      {
        name: 'Premium Dark Chocolate Truffle',
        category: 'Chocolate',
        price: 4.99,
        quantity: 20,
        description: 'Handcrafted Belgian dark chocolate truffle with gold leaf',
        image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400'
      },
      {
        name: 'Artisan Strawberry Macarons',
        category: 'Macaron',
        price: 6.99,
        quantity: 15,
        description: 'French-style macarons with real strawberry filling',
        image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400'
      },
      {
        name: 'Himalayan Salt Caramels',
        category: 'Caramel',
        price: 3.99,
        quantity: 30,
        description: 'Gourmet caramels infused with pink Himalayan salt',
        image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400'
      }
    ];

    const createdSweets = [];
    for (const sweetData of premiumSweets) {
      try {
        const sweet = await Sweet.create(sweetData);
        createdSweets.push(sweet);
        console.log(`✅ Added: ${sweet.name} - ₹${sweet.price} (${sweet.quantity} available)`);
      } catch (error) {
        console.log(`ℹ️  Sweet "${sweetData.name}" already exists`);
      }
    }

    // 4. Database Operations Demo
    console.log('\n🔍 4. Database Query Operations');
    console.log('-------------------------------');
    
    // Search operations
    const allSweets = await Sweet.findAll();
    console.log(`📊 Total sweets in inventory: ${allSweets.length}`);
    
    const chocolateSweets = await Sweet.search({ category: 'Chocolate' });
    console.log(`🍫 Chocolate varieties: ${chocolateSweets.length}`);
    
    const premiumSweets_search = await Sweet.search({ minPrice: 4.00 });
    console.log(`💎 Premium sweets (₹4+): ${premiumSweets_search.length}`);
    
    const categories = await Sweet.getCategories();
    console.log(`🏷️  Available categories: ${categories.join(', ')}`);

    // 5. E-commerce Operations Demo
    console.log('\n🛒 5. E-commerce Operations');
    console.log('---------------------------');
    
    if (allSweets.length > 0 && demoUser) {
      const sweetToPurchase = allSweets.find(s => s.quantity > 0);
      if (sweetToPurchase) {
        console.log(`🛍️  Customer purchasing: ${sweetToPurchase.name}`);
        
        try {
          const purchaseResult = await Sweet.purchase(sweetToPurchase.id, 2, demoUser.id);
          console.log(`✅ Purchase successful!`);
          console.log(`   💰 Total: ₹${purchaseResult.purchase.totalPrice}`);
          console.log(`   📦 Quantity purchased: ${purchaseResult.purchase.quantity}`);
          console.log(`   📊 Remaining stock: ${purchaseResult.sweet.quantity}`);
        } catch (error) {
          console.log(`❌ Purchase failed: ${error.message}`);
        }
      }
    }

    // 6. System Statistics
    console.log('\n📈 6. System Statistics');
    console.log('----------------------');
    
    const stats = {
      users: await database.get('SELECT COUNT(*) as count FROM users'),
      sweets: await database.get('SELECT COUNT(*) as count FROM sweets'),
      purchases: await database.get('SELECT COUNT(*) as count FROM purchases'),
      totalRevenue: await database.get('SELECT COALESCE(SUM(total_price), 0) as total FROM purchases')
    };
    
    console.log(`👥 Total users: ${stats.users.count}`);
    console.log(`🍬 Total sweets: ${stats.sweets.count}`);
    console.log(`🛒 Total purchases: ${stats.purchases.count}`);
    console.log(`💰 Total revenue: ₹${stats.totalRevenue.total}`);

    // 7. Application URLs
    console.log('\n🌐 7. Application Access');
    console.log('------------------------');
    console.log('🎨 Frontend (Next.js): http://localhost:3000');
    console.log('🔧 Backend API: http://localhost:3001');
    console.log('📁 Database file: ./database/sweetshop.db');
    
    console.log('\n🎯 Available Features:');
    console.log('   ✅ Premium brown-themed UI with INR currency (₹)');
    console.log('   ✅ Category-based fallback images');
    console.log('   ✅ SQLite database with full CRUD operations');
    console.log('   ✅ User authentication & authorization');
    console.log('   ✅ Purchase & inventory management');
    console.log('   ✅ Search & filtering capabilities');
    console.log('   ✅ Comprehensive test suite (Jest)');
    console.log('   ✅ Admin dashboard for management');
    console.log('   ✅ Responsive design for all devices');

    console.log('\n🧪 Testing Commands:');
    console.log('   📊 Backend tests: npm run test:unit');
    console.log('   🔗 Integration tests: npm run test:integration');
    console.log('   🎨 Frontend tests: cd frontend && npm run test');
    console.log('   📈 Coverage report: npm run test:coverage');

    console.log('\n🎉 Sweet Shop Demo Complete!');
    console.log('Your premium SQLite-powered sweet shop is ready! 🍭✨');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  } finally {
    await database.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the complete demo
if (require.main === module) {
  runCompleteDemo();
}

module.exports = { runCompleteDemo };
