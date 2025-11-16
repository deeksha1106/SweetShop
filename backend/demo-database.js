#!/usr/bin/env node

/**
 * Sweet Shop SQLite Database Demo
 * This script demonstrates the SQLite database functionality
 */

const database = require('./config/database');
const Sweet = require('./models/Sweet');
const User = require('./models/User');

async function demonstrateDatabase() {
  console.log('🍭 Sweet Shop SQLite Database Demo\n');
  
  try {
    // Connect to database
    await database.connect();
    console.log('✅ Connected to SQLite database');
    
    // Create tables manually (without closing connection)
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await database.run(`
      CREATE TABLE IF NOT EXISTS sweets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        description TEXT,
        image_url VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await database.run(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sweet_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (sweet_id) REFERENCES sweets(id)
      )
    `);
    
    await database.run(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sweet_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        quantity_change INTEGER NOT NULL,
        old_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sweet_id) REFERENCES sweets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    console.log('✅ Database tables ready');
    
    // Create a test user
    console.log('\n👤 Creating test user...');
    let testUser;
    try {
      testUser = await User.create({
        email: 'demo@sweetshop.com',
        password: 'demo123',
        role: 'user'
      });
      console.log(`✅ Created user: ${testUser.email} (ID: ${testUser.id})`);
    } catch (error) {
      // User might already exist
      testUser = await User.findByEmail('demo@sweetshop.com');
      console.log(`ℹ️  Using existing user: ${testUser.email} (ID: ${testUser.id})`);
    }
    
    // Create some sweets
    console.log('\n🍬 Creating sweets...');
    const sweetsData = [
      {
        name: 'Dark Chocolate Truffle',
        category: 'Chocolate',
        price: 3.99,
        quantity: 25,
        description: 'Rich dark chocolate truffle with cocoa powder',
        image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400'
      },
      {
        name: 'Strawberry Gummy Bears',
        category: 'Gummy',
        price: 2.49,
        quantity: 50,
        description: 'Chewy strawberry-flavored gummy bears',
        image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400'
      },
      {
        name: 'Caramel Lollipop',
        category: 'Lollipop',
        price: 1.99,
        quantity: 30,
        description: 'Sweet caramel lollipop on a stick',
        image_url: 'https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?w=400'
      }
    ];
    
    const createdSweets = [];
    for (const sweetData of sweetsData) {
      try {
        const sweet = await Sweet.create(sweetData);
        createdSweets.push(sweet);
        console.log(`✅ Created: ${sweet.name} - ₹${sweet.price} (${sweet.quantity} in stock)`);
      } catch (error) {
        console.log(`ℹ️  Sweet "${sweetData.name}" might already exist`);
      }
    }
    
    // Demonstrate database queries
    console.log('\n📊 Database Operations Demo:');
    
    // 1. Find all sweets
    const allSweets = await Sweet.findAll();
    console.log(`\n1. Total sweets in database: ${allSweets.length}`);
    allSweets.forEach(sweet => {
      console.log(`   - ${sweet.name} (${sweet.category}) - ₹${sweet.price}`);
    });
    
    // 2. Search by category
    const chocolateSweets = await Sweet.search({ category: 'Chocolate' });
    console.log(`\n2. Chocolate sweets found: ${chocolateSweets.length}`);
    chocolateSweets.forEach(sweet => {
      console.log(`   - ${sweet.name} - ₹${sweet.price}`);
    });
    
    // 3. Search by price range
    const affordableSweets = await Sweet.search({ minPrice: 1.00, maxPrice: 3.00 });
    console.log(`\n3. Sweets under ₹3.00: ${affordableSweets.length}`);
    affordableSweets.forEach(sweet => {
      console.log(`   - ${sweet.name} - ₹${sweet.price}`);
    });
    
    // 4. Get categories
    const categories = await Sweet.getCategories();
    console.log(`\n4. Available categories: ${categories.join(', ')}`);
    
    // 5. Demonstrate purchase (if we have sweets and user)
    if (allSweets.length > 0 && testUser) {
      const sweetToPurchase = allSweets[0];
      console.log(`\n5. Purchasing ${sweetToPurchase.name}...`);
      
      try {
        const purchaseResult = await Sweet.purchase(sweetToPurchase.id, 2, testUser.id);
        console.log(`✅ Purchase successful!`);
        console.log(`   - Quantity before: ${sweetToPurchase.quantity}`);
        console.log(`   - Quantity after: ${purchaseResult.sweet.quantity}`);
        console.log(`   - Total paid: ₹${purchaseResult.purchase.totalPrice}`);
      } catch (error) {
        console.log(`❌ Purchase failed: ${error.message}`);
      }
    }
    
    // 6. Database statistics
    console.log('\n📈 Database Statistics:');
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    const sweetCount = await database.get('SELECT COUNT(*) as count FROM sweets');
    const purchaseCount = await database.get('SELECT COUNT(*) as count FROM purchases');
    
    console.log(`   - Users: ${userCount.count}`);
    console.log(`   - Sweets: ${sweetCount.count}`);
    console.log(`   - Purchases: ${purchaseCount.count}`);
    
    console.log('\n🎉 SQLite Database Demo Complete!');
    console.log('\nYour Sweet Shop is using SQLite database successfully! 🍭');
    console.log('Database file location: ./database/sweetshop.db');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    await database.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the demo
if (require.main === module) {
  demonstrateDatabase();
}

module.exports = { demonstrateDatabase };
