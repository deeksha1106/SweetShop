const database = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  try {
    await database.connect();


    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sweetshop.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);


    const existingAdmin = await database.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (!existingAdmin) {
      await database.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, 'admin']
      );
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }


    const sampleSweets = [
      {
        name: 'Chocolate Truffle',
        category: 'Chocolate',
        price: 2.50,
        quantity: 50,
        description: 'Rich and creamy chocolate truffle with cocoa powder coating',
        image_url: '/images/chocolate-truffle.jpg'
      },
      {
        name: 'Strawberry Gummy Bears',
        category: 'Gummy',
        price: 1.25,
        quantity: 100,
        description: 'Soft and chewy strawberry-flavored gummy bears',
        image_url: '/images/strawberry-gummy.jpg'
      },
      {
        name: 'Vanilla Fudge',
        category: 'Fudge',
        price: 3.00,
        quantity: 30,
        description: 'Smooth and creamy vanilla fudge made with real vanilla beans',
        image_url: '/images/vanilla-fudge.jpg'
      },
      {
        name: 'Rainbow Lollipop',
        category: 'Lollipop',
        price: 0.75,
        quantity: 200,
        description: 'Colorful rainbow swirl lollipop on a stick',
        image_url: '/images/rainbow-lollipop.jpg'
      },
      {
        name: 'Dark Chocolate Bar',
        category: 'Chocolate',
        price: 4.50,
        quantity: 25,
        description: '70% dark chocolate bar with sea salt crystals',
        image_url: '/images/dark-chocolate.jpg'
      },
      {
        name: 'Caramel Chews',
        category: 'Caramel',
        price: 2.00,
        quantity: 75,
        description: 'Soft caramel chews with a hint of sea salt',
        image_url: '/images/caramel-chews.jpg'
      },
      {
        name: 'Mint Chocolate Chip',
        category: 'Chocolate',
        price: 3.25,
        quantity: 40,
        description: 'Refreshing mint chocolate with real chocolate chips',
        image_url: '/images/mint-chocolate.jpg'
      },
      {
        name: 'Sour Patch Kids',
        category: 'Sour',
        price: 1.50,
        quantity: 80,
        description: 'First they\'re sour, then they\'re sweet!',
        image_url: '/images/sour-patch.jpg'
      },
      {
        name: 'Peanut Butter Cups',
        category: 'Chocolate',
        price: 2.75,
        quantity: 60,
        description: 'Creamy peanut butter wrapped in milk chocolate',
        image_url: '/images/peanut-butter-cups.jpg'
      },
      {
        name: 'Cotton Candy',
        category: 'Candy',
        price: 1.00,
        quantity: 0,
        description: 'Fluffy pink cotton candy that melts in your mouth',
        image_url: '/images/cotton-candy.jpg'
      }
    ];


    const existingSweets = await database.all('SELECT COUNT(*) as count FROM sweets');
    
    if (existingSweets[0].count === 0) {
      for (const sweet of sampleSweets) {
        await database.run(
          'INSERT INTO sweets (name, category, price, quantity, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
          [sweet.name, sweet.category, sweet.price, sweet.quantity, sweet.description, sweet.image_url]
        );
      }
      console.log('✅ Sample sweets data inserted');
    } else {
      console.log('ℹ️ Sweets data already exists');
    }

    console.log('✅ Database seeded successfully');
    console.log(`Admin credentials: ${adminEmail} / ${adminPassword}`);
    await database.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}


if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
