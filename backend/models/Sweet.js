const database = require('../config/database');

class Sweet {
  static async create(sweetData) {
    const { name, category, price, quantity = 0, description, image_url } = sweetData;

    if (!name || !category || price === undefined) {
      throw new Error('Missing required fields');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Invalid price');
    }

    const result = await database.run(
      'INSERT INTO sweets (name, category, price, quantity, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, price, quantity, description ?? null, image_url ?? null]
    );
    
    return this.findById(result.id);
  }

  static async findById(id) {
    const row = await database.get('SELECT * FROM sweets WHERE id = ?', [id]);
    return row || null;
  }

  static async findAll() {
    return await database.all('SELECT * FROM sweets ORDER BY created_at DESC');
  }

  static async update(id, sweetData) {

    const currentSweet = await this.findById(id);
    if (!currentSweet) {
      throw new Error('Sweet not found');
    }
    

    const updatedData = {
      name: sweetData.name !== undefined ? sweetData.name : currentSweet.name,
      category: sweetData.category !== undefined ? sweetData.category : currentSweet.category,
      price: sweetData.price !== undefined ? sweetData.price : currentSweet.price,
      quantity: sweetData.quantity !== undefined ? sweetData.quantity : currentSweet.quantity,
      description: sweetData.description !== undefined ? sweetData.description : currentSweet.description,
      image_url: sweetData.image_url !== undefined ? sweetData.image_url : currentSweet.image_url
    };


    if (typeof updatedData.price !== 'number' || updatedData.price < 0) {
      throw new Error('Invalid price');
    }
    

    await new Promise(resolve => setTimeout(resolve, 10));
    await database.run(
      "UPDATE sweets SET name = ?, category = ?, price = ?, quantity = ?, description = ?, image_url = ?, updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE id = ?",
      [updatedData.name, updatedData.category, updatedData.price, updatedData.quantity, updatedData.description, updatedData.image_url, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    const result = await database.run('DELETE FROM sweets WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async search(searchParams) {
    let sql = 'SELECT * FROM sweets WHERE 1=1';
    const params = [];

    if (searchParams.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${searchParams.name}%`);
    }

    if (searchParams.category) {
      sql += ' AND category LIKE ?';
      params.push(`%${searchParams.category}%`);
    }

    if (searchParams.minPrice) {
      sql += ' AND price >= ?';
      params.push(searchParams.minPrice);
    }

    if (searchParams.maxPrice) {
      sql += ' AND price <= ?';
      params.push(searchParams.maxPrice);
    }

    if (searchParams.inStock) {
      sql += ' AND quantity > 0';
    }

    sql += ' ORDER BY created_at DESC';

    return await database.all(sql, params);
  }

  static async updateQuantity(id, newQuantity) {
    await database.run(
      'UPDATE sweets SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, id]
    );
    
    return this.findById(id);
  }

  static async purchase(id, quantity, userId = null) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Invalid quantity');
    }

    const sweet = await this.findById(id);
    if (!sweet) {
      throw new Error('Sweet not found');
    }

    if (sweet.quantity < quantity) {
      throw new Error('Insufficient quantity in stock');
    }

    const newQuantity = sweet.quantity - quantity;
    const totalPrice = sweet.price * quantity;

    await database.run('BEGIN TRANSACTION');
    try {
      await database.run(
        'UPDATE sweets SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, id]
      );


      if (userId) {
        await database.run(
          'INSERT INTO purchases (user_id, sweet_id, quantity, total_price) VALUES (?, ?, ?, ?)',
          [userId, id, quantity, totalPrice]
        );
        await database.run(
          'INSERT INTO inventory_logs (sweet_id, user_id, action, quantity_change, previous_quantity, new_quantity) VALUES (?, ?, ?, ?, ?, ?)',
          [id, userId, 'purchase', -quantity, sweet.quantity, newQuantity]
        );
      }

      await database.run('COMMIT');
      

      if (userId) {

        return {
          sweet: await this.findById(id),
          purchase: {
            quantity,
            totalPrice,
            remainingStock: newQuantity
          }
        };
      } else {

        return true;
      }
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  static async restock(id, quantity, userId) {
    const sweet = await this.findById(id);
    if (!sweet) {
      throw new Error('Sweet not found');
    }

    const newQuantity = sweet.quantity + quantity;


    await database.run('BEGIN TRANSACTION');

    try {

      await database.run(
        'UPDATE sweets SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, id]
      );


      await database.run(
        'INSERT INTO inventory_logs (sweet_id, user_id, action, quantity_change, previous_quantity, new_quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, 'restock', quantity, sweet.quantity, newQuantity]
      );

      await database.run('COMMIT');

      return await this.findById(id);
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  static async getCategories() {
    const result = await database.all('SELECT DISTINCT category FROM sweets ORDER BY category');
    return result.map(row => row.category);
  }

  static async getPurchaseHistory(userId) {
    return await database.all(`
      SELECT p.*, s.name as sweet_name, s.price as unit_price
      FROM purchases p
      JOIN sweets s ON p.sweet_id = s.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
  }

  static async getInventoryLogs(sweetId = null) {
    let sql = `
      SELECT il.*, s.name as sweet_name, u.email as user_email
      FROM inventory_logs il
      JOIN sweets s ON il.sweet_id = s.id
      JOIN users u ON il.user_id = u.id
    `;
    
    const params = [];
    if (sweetId) {
      sql += ' WHERE il.sweet_id = ?';
      params.push(sweetId);
    }
    
    sql += ' ORDER BY il.created_at DESC';
    
    return await database.all(sql, params);
  }
}

module.exports = Sweet;
