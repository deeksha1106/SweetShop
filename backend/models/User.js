const database = require('../config/database');
const bcrypt = require('bcryptjs');

const isValidEmail = (email) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

class User {
  static async create(userData) {
    const { email, password, role = 'user' } = userData;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (!isValidEmail(email)) {
      throw new Error('Invalid email');
    }
    if (password.length < 6) {
      throw new Error('Password too short');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await database.run(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );

    return this.findById(result.id);
  }

  static async findById(id) {

    const row = await database.get('SELECT * FROM users WHERE id = ?', [id]);
    return row || null;
  }

  static async findByEmail(email) {
    const row = await database.get('SELECT * FROM users WHERE email = ?', [email]);
    return row || null;
  }


  static async validatePassword(emailOrId, plainPassword) {
    let user;
    if (typeof emailOrId === 'number') {

      user = await database.get('SELECT * FROM users WHERE id = ?', [emailOrId]);
    } else {

      user = await this.findByEmail(emailOrId);
    }
    if (!user) return false;
    return await bcrypt.compare(plainPassword, user.password);
  }

  static async findAll() {
    return await database.all('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
  }

  static async update(id, updates) {

    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    let updateFields = [];
    let updateValues = [];

    if (updates.email !== undefined) {

      const existingEmail = await this.findByEmail(updates.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('Email already exists');
      }
      updateFields.push('email = ?');
      updateValues.push(updates.email);
    }

    if (updates.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updates.role !== undefined) {
      const allowed = ['user', 'admin'];
      if (!allowed.includes(updates.role)) {
        throw new Error('Invalid role');
      }
      updateFields.push('role = ?');
      updateValues.push(updates.role);
    }

    if (updateFields.length > 0) {

      await new Promise(resolve => setTimeout(resolve, 10));
      updateFields.push("updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')");
      updateValues.push(id);
      
      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await database.run(sql, updateValues);
    }

    return this.findById(id);
  }

  static async updateRole(id, role) {
    return this.update(id, { role });
  }

  static async delete(id) {
    const result = await database.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async exists(email) {
    const user = await database.get('SELECT id FROM users WHERE email = ?', [email]);
    return !!user;
  }

  static async getUserStats(userId) {
    const user = await this.findById(userId);
    if (!user) return null;


    const purchaseStats = await database.get(`
      SELECT 
        COUNT(*) as totalPurchases,
        COALESCE(SUM(total_price), 0) as totalSpent
      FROM purchases 
      WHERE user_id = ?
    `, [userId]);


    const categoryStats = await database.all(`
      SELECT s.category, COUNT(*) as count
      FROM purchases p
      JOIN sweets s ON p.sweet_id = s.id
      WHERE p.user_id = ?
      GROUP BY s.category
      ORDER BY count DESC
      LIMIT 5
    `, [userId]);

    return {
      totalPurchases: purchaseStats.totalPurchases || 0,
      totalSpent: parseFloat(purchaseStats.totalSpent) || 0,
      favoriteCategories: categoryStats.map(c => c.category) || []
    };
  }
}

module.exports = User;
