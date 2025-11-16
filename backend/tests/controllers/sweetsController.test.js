const request = require('supertest');
const app = require('../../server');
const database = require('../../config/database');
const Sweet = require('../../models/Sweet');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Sweets Controller', () => {
  let userToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testSweet;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      email: 'testuser@sweetshop.com',
      password: 'password123',
      role: 'user'
    });

    testAdmin = await User.create({
      email: 'testadmin@sweetshop.com',
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
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await database.run('DELETE FROM sweets WHERE name LIKE "%Test%"');
      await database.run('DELETE FROM purchases WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);
      await database.run('DELETE FROM inventory_logs WHERE user_id IN (?, ?)', [testUser.id, testAdmin.id]);
      await database.run('DELETE FROM users WHERE email LIKE "%test%"');
    } catch (error) {
      // Ignore cleanup errors
    }
    // Don't close database - let global teardown handle it
  });

  describe('GET /api/sweets', () => {
    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Chocolate',
        category: 'Chocolate',
        price: 2.50,
        quantity: 100,
        description: 'Test chocolate description'
      });
    });

    test('should get all sweets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sweets retrieved successfully');
      expect(Array.isArray(response.body.data.sweets)).toBe(true);
      expect(response.body.data.count).toBeDefined();
      expect(response.body.data.sweets.length).toBeGreaterThan(0);
    });

    test('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should return empty array when no sweets exist', async () => {
      await database.run('DELETE FROM sweets');

      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweets).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('GET /api/sweets/:id', () => {
    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Single Sweet',
        category: 'Chocolate',
        price: 3.00,
        quantity: 50
      });
    });

    test('should get sweet by valid ID', async () => {
      const response = await request(app)
        .get(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.id).toBe(testSweet.id);
      expect(response.body.data.sweet.name).toBe('Test Single Sweet');
    });

    test('should return 404 for non-existent sweet', async () => {
      const response = await request(app)
        .get('/api/sweets/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sweet not found');
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get(`/api/sweets/${testSweet.id}`)
        .expect(401);
    });
  });

  describe('POST /api/sweets', () => {
    const validSweetData = {
      name: 'Test New Sweet',
      category: 'Candy',
      price: 1.75,
      quantity: 75,
      description: 'A delicious test sweet',
      image_url: 'https://example.com/images/test-sweet.jpg'
    };

    test('should create sweet as admin', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSweetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sweet created successfully');
      expect(response.body.data.sweet.name).toBe(validSweetData.name);
      expect(response.body.data.sweet.category).toBe(validSweetData.category);
      expect(response.body.data.sweet.price).toBe(validSweetData.price);
    });

    test('should return 403 for regular user', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSweetData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app)
        .post('/api/sweets')
        .send(validSweetData)
        .expect(401);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        category: 'Candy',
        price: -1 // Invalid price
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    test('should handle missing required fields', async () => {
      const incompleteData = {
        name: 'Test Incomplete'
        // Missing category and price
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/sweets/:id', () => {
    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Update Sweet',
        category: 'Chocolate',
        price: 2.00,
        quantity: 30
      });
    });

    test('should update sweet as admin', async () => {
      const updateData = {
        name: 'Updated Test Sweet',
        price: 3.50,
        quantity: 50
      };

      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.name).toBe(updateData.name);
      expect(response.body.data.sweet.price).toBe(updateData.price);
      expect(response.body.data.sweet.quantity).toBe(updateData.quantity);
    });

    test('should return 403 for regular user', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should return 404 for non-existent sweet', async () => {
      const updateData = { name: 'Update Non-existent' };

      const response = await request(app)
        .put('/api/sweets/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Sweet not found');
    });

    test('should validate update data', async () => {
      const invalidData = {
        price: -5.00 // Invalid price
      };

      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Delete Sweet',
        category: 'Chocolate',
        price: 2.00,
        quantity: 10
      });
    });

    test('should delete sweet as admin', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedId).toBe(testSweet.id.toString());

      // Verify deletion
      const checkResponse = await request(app)
        .get(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    test('should return 403 for regular user', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should return 404 for non-existent sweet', async () => {
      const response = await request(app)
        .delete('/api/sweets/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Sweet not found');
    });
  });

  describe('GET /api/sweets/search', () => {
    beforeEach(async () => {
      await Sweet.create({
        name: 'Test Chocolate Bar',
        category: 'Chocolate',
        price: 3.00,
        quantity: 20
      });
      await Sweet.create({
        name: 'Test Gummy Bears',
        category: 'Gummy',
        price: 1.50,
        quantity: 0
      });
      await Sweet.create({
        name: 'Test Chocolate Truffle',
        category: 'Chocolate',
        price: 4.50,
        quantity: 15
      });
    });

    test('should search by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.length).toBe(2);
      expect(response.body.data.sweets.every(s => s.name.includes('Chocolate'))).toBe(true);
    });

    test('should search by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search?category=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweets.length).toBe(2);
      expect(response.body.data.sweets.every(s => s.category === 'Chocolate')).toBe(true);
    });

    test('should search by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=2.00&maxPrice=4.00')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweets.length).toBe(1);
      expect(response.body.data.sweets[0].price).toBe(3.00);
    });

    test('should search for in-stock items', async () => {
      const response = await request(app)
        .get('/api/sweets/search?inStock=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweets.every(s => s.quantity > 0)).toBe(true);
    });

    test('should return search parameters in response', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=Test&category=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.searchParams.name).toBe('Test');
      expect(response.body.data.searchParams.category).toBe('Chocolate');
    });

    test('should return empty results for no matches', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=NonExistent')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweets.length).toBe(0);
    });
  });

  describe('GET /api/sweets/categories', () => {
    beforeEach(async () => {
      await Sweet.create({
        name: 'Test Cat 1',
        category: 'Chocolate',
        price: 1.00
      });
      await Sweet.create({
        name: 'Test Cat 2',
        category: 'Candy',
        price: 1.00
      });
    });

    test('should get all categories', async () => {
      const response = await request(app)
        .get('/api/sweets/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories).toContain('Chocolate');
      expect(response.body.data.categories).toContain('Candy');
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/sweets/categories')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
