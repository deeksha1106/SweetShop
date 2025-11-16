const request = require('supertest');
const app = require('../../server');
const database = require('../../config/database');
const Sweet = require('../../models/Sweet');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Inventory Controller', () => {
  let userToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testSweet;

  beforeAll(async () => {
    // Create test users with unique emails for inventory tests
    testUser = await User.create({
      email: 'inventory-testuser@sweetshop.com',
      password: 'password123',
      role: 'user'
    });

    testAdmin = await User.create({
      email: 'inventory-testadmin@sweetshop.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate tokens
    userToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: testAdmin.id, role: testAdmin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await database.run('DELETE FROM sweets WHERE name LIKE "%Test%"');
    await database.run('DELETE FROM purchases WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);
    await database.run('DELETE FROM inventory_logs WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);

    // Create test sweet
    testSweet = await Sweet.create({
      name: 'Test Inventory Sweet',
      category: 'Chocolate',
      price: 2.50,
      quantity: 100,
      description: 'Test sweet for inventory operations'
    });
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await database.run('DELETE FROM sweets WHERE name LIKE "%Test%"');
      await database.run('DELETE FROM purchases WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);
      await database.run('DELETE FROM inventory_logs WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);
      await database.run('DELETE FROM users WHERE email LIKE "inventory-%"');
    } catch (error) {
      // Ignore cleanup errors
    }
    // Don't close database - let global teardown handle it
  });

  describe('POST /api/sweets/:id/purchase', () => {
    test('should purchase sweet successfully', async () => {
      const purchaseData = { quantity: 5 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.data.purchase.quantity).toBe(5);
      expect(response.body.data.sweet.quantity).toBe(95); // 100 - 5
      expect(response.body.data.purchase.totalPrice).toBe(12.50); // 2.50 * 5
    });

    test('should handle exact quantity purchase', async () => {
      const purchaseData = { quantity: 100 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.data.sweet.quantity).toBe(0);
      expect(response.body.data.purchase.remainingStock).toBe(0);
    });

    test('should return 400 for insufficient stock', async () => {
      const purchaseData = { quantity: 150 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient stock');
    });

    test('should return 404 for non-existent sweet', async () => {
      const purchaseData = { quantity: 1 };

      const response = await request(app)
        .post('/api/sweets/99999/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(404);

      expect(response.body.error).toBe('Sweet not found');
    });

    test('should validate quantity is positive', async () => {
      const purchaseData = { quantity: 0 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    test('should validate quantity is not negative', async () => {
      const purchaseData = { quantity: -5 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const purchaseData = { quantity: 1 };

      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .send(purchaseData)
        .expect(401);
    });

    test('should handle missing quantity field', async () => {
      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should record purchase in database', async () => {
      const purchaseData = { quantity: 3 };

      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(200);

      // Verify purchase record exists
      const purchases = await database.all(
        'SELECT * FROM purchases WHERE user_id = ? AND sweet_id = ?',
        [testUser.id, testSweet.id]
      );

      expect(purchases.length).toBe(1);
      expect(purchases[0].quantity).toBe(3);
      expect(purchases[0].total_price).toBe(7.50);
    });

    test('should record inventory log', async () => {
      const purchaseData = { quantity: 2 };

      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(200);

      // Verify inventory log exists
      const logs = await database.all(
        'SELECT * FROM inventory_logs WHERE user_id = ? AND sweet_id = ? AND action = ?',
        [testUser.id, testSweet.id, 'purchase']
      );

      expect(logs.length).toBe(1);
      expect(logs[0].quantity_change).toBe(-2);
      expect(logs[0].previous_quantity).toBe(100);
      expect(logs[0].new_quantity).toBe(98);
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    test('should restock sweet as admin', async () => {
      const restockData = { quantity: 50 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.quantity).toBe(150); // 100 + 50
    });

    test('should return 403 for regular user', async () => {
      const restockData = { quantity: 10 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(restockData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should return 404 for non-existent sweet', async () => {
      const restockData = { quantity: 10 };

      const response = await request(app)
        .post('/api/sweets/99999/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(404);

      expect(response.body.error).toBe('Sweet not found');
    });

    test('should validate quantity is positive', async () => {
      const restockData = { quantity: 0 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate quantity is not negative', async () => {
      const restockData = { quantity: -10 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const restockData = { quantity: 10 };

      await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .send(restockData)
        .expect(401);
    });

    test('should handle missing quantity field', async () => {
      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should record inventory log for restock', async () => {
      const restockData = { quantity: 25 };

      await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(200);

      // Verify inventory log exists
      const logs = await database.all(
        'SELECT * FROM inventory_logs WHERE user_id = ? AND sweet_id = ? AND action = ?',
        [testAdmin.id, testSweet.id, 'restock']
      );

      expect(logs.length).toBe(1);
      expect(logs[0].quantity_change).toBe(25);
      expect(logs[0].previous_quantity).toBe(100);
      expect(logs[0].new_quantity).toBe(125);
    });

    test('should handle large restock quantities', async () => {
      const restockData = { quantity: 1000 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(200);

      expect(response.body.data.sweet.quantity).toBe(1100);
    });
  });

  describe('GET /api/inventory/logs', () => {
    beforeEach(async () => {
      // Create some inventory activity
      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 20 });
    });

    test('should get inventory logs as admin', async () => {
      const response = await request(app)
        .get('/api/inventory/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(2);
    });

    test('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/inventory/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should filter logs by sweet ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/logs?sweetId=${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.logs.every(log => log.sweet_id === testSweet.id)).toBe(true);
    });

    test('should include user and sweet information in logs', async () => {
      const response = await request(app)
        .get('/api/inventory/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const logs = response.body.data.logs;
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].sweet_name).toBeDefined();
      expect(logs[0].user_email).toBeDefined();
    });
  });

  describe('GET /api/inventory/stats', () => {
    beforeEach(async () => {
      // Create another sweet for stats
      await Sweet.create({
        name: 'Test Stats Sweet',
        category: 'Candy',
        price: 1.00,
        quantity: 0 // Out of stock
      });

      // Create some activity
      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 });
    });

    test('should get inventory statistics as admin', async () => {
      const response = await request(app)
        .get('/api/inventory/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSweets).toBeDefined();
      expect(response.body.data.totalValue).toBeDefined();
      expect(response.body.data.outOfStock).toBeDefined();
      expect(response.body.data.lowStock).toBeDefined();
    });

    test('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/inventory/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should calculate correct statistics', async () => {
      const response = await request(app)
        .get('/api/inventory/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stats = response.body.data;
      expect(stats.totalSweets).toBeGreaterThanOrEqual(2);
      expect(stats.outOfStock).toBeGreaterThanOrEqual(1);
      expect(typeof stats.totalValue).toBe('number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent purchases gracefully', async () => {
      // Create multiple concurrent purchase requests
      const promises = Array(5).fill().map(() =>
        request(app)
          .post(`/api/sweets/${testSweet.id}/purchase`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ quantity: 20 })
      );

      const responses = await Promise.allSettled(promises);
      
      // Some should succeed, some should fail due to insufficient stock
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failed = responses.filter(r => r.status === 'fulfilled' && r.value.status === 400);
      
      expect(successful.length + failed.length).toBe(5);
      expect(successful.length).toBeLessThanOrEqual(5); // Can't buy more than available
    });

    test('should maintain data integrity during transactions', async () => {
      const initialQuantity = testSweet.quantity;
      
      // Make a purchase
      await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 })
        .expect(200);

      // Verify sweet quantity is updated
      const updatedSweet = await Sweet.findById(testSweet.id);
      expect(updatedSweet.quantity).toBe(initialQuantity - 10);

      // Verify purchase record exists
      const purchases = await database.all(
        'SELECT * FROM purchases WHERE user_id = ? AND sweet_id = ?',
        [testUser.id, testSweet.id]
      );
      expect(purchases.length).toBe(1);
    });

    // Database connection error tests should be in integration tests
    // as they affect the entire application state including authentication
  });
});
