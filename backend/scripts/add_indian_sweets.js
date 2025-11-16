const database = require('../config/database');

async function addIndianSweets() {
  const indianSweets = [
    {
      name: 'Gulab Jamun',
      category: 'Indian',
      price: 3.50,
      quantity: 60,
      description: 'Soft khoya dumplings soaked in cardamom-infused sugar syrup.',
      image_url: 'https://images.unsplash.com/photo-1626131718431-4627c93a34aa?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Jalebi',
      category: 'Indian',
      price: 2.50,
      quantity: 80,
      description: 'Crispy spirals soaked in saffron sugar syrup, a festive favorite.',
      image_url: 'https://images.unsplash.com/photo-1589308078056-8323a9dfce86?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Rasmalai',
      category: 'Indian',
      price: 4.00,
      quantity: 40,
      description: 'Delicate cottage cheese patties soaked in saffron pistachio milk.',
      image_url: 'https://images.unsplash.com/photo-1685209999683-6cf8bd3682c2?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Kaju Katli',
      category: 'Indian',
      price: 5.00,
      quantity: 50,
      description: 'Thin diamond-shaped cashew fudge with edible silver leaf.',
      image_url: 'https://images.unsplash.com/photo-1606791900191-1e34f1cd5df2?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Besan Ladoo',
      category: 'Indian',
      price: 2.75,
      quantity: 90,
      description: 'Roasted gram flour laddoos with ghee, sugar, and nuts.',
      image_url: 'https://images.unsplash.com/photo-1617984248499-0230f33e28ff?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Rasgulla',
      category: 'Indian',
      price: 3.25,
      quantity: 70,
      description: 'Spongy cottage cheese balls soaked in light sugar syrup.',
      image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c2d880?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Soan Papdi',
      category: 'Indian',
      price: 2.25,
      quantity: 100,
      description: 'Flaky, melt-in-mouth sweet with a delicate cardamom flavor.',
      image_url: 'https://images.unsplash.com/photo-1668236540476-43c1a41ad75b?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Mysore Pak',
      category: 'Indian',
      price: 3.75,
      quantity: 55,
      description: 'Rich South Indian sweet made with gram flour, ghee, and sugar.',
      image_url: 'https://images.unsplash.com/photo-1624892218341-9370bc0a8228?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Motichoor Ladoo',
      category: 'Indian',
      price: 3.00,
      quantity: 85,
      description: 'Tiny boondi pearls bound into laddoos, festive and fragrant.',
      image_url: 'https://images.unsplash.com/photo-1632895563920-8c0b2d141787?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Peda',
      category: 'Indian',
      price: 2.80,
      quantity: 75,
      description: 'Milk-based fudgy peda flavored with saffron and cardamom.',
      image_url: 'https://images.unsplash.com/photo-1668236540260-38a072fb1975?q=80&w=1600&auto=format&fit=crop'
    },
  ];

  try {
    await database.connect();
    for (const sweet of indianSweets) {
      const existing = await database.get('SELECT id FROM sweets WHERE name = ?', [sweet.name]);
      if (!existing) {
        await database.run(
          'INSERT INTO sweets (name, category, price, quantity, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
          [sweet.name, sweet.category, sweet.price, sweet.quantity, sweet.description, sweet.image_url]
        );
        console.log(`✅ Added: ${sweet.name}`);
      } else {
        console.log(`ℹ️ Skipped (exists): ${sweet.name}`);
      }
    }
    await database.close();
    console.log('✅ Indian sweets upsert complete');
  } catch (err) {
    console.error('❌ Failed to add Indian sweets', err);
    process.exit(1);
  }
}

if (require.main === module) {
  addIndianSweets();
}

module.exports = addIndianSweets;
