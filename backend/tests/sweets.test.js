const request = require('supertest');
const app = require('../server');
const database = require('../config/database');

describe('Sweets Endpoints', () => {
  let userToken;
  let adminToken;
  let testSweetId;

  beforeAll(async () => {
    await database.connect();
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    userToken = userResponse.body.data.token;

    // Create test admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testadmin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await database.run('DELETE FROM users WHERE email LIKE "%test%"');
    await database.run('DELETE FROM sweets WHERE name LIKE "%Test%"');
    await database.close();
  });

  describe('POST /api/sweets', () => {
    test('should create sweet as admin', async () => {
      const sweetData = {
        name: 'Test Chocolate',
        category: 'Chocolate',
        price: 2.50,
        quantity: 100,
        description: 'Test chocolate description'
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.name).toBe(sweetData.name);
      expect(response.body.data.sweet.price).toBe(sweetData.price);
      testSweetId = response.body.data.sweet.id;
    });

    test('should not create sweet as regular user', async () => {
      const sweetData = {
        name: 'Test Candy',
        category: 'Candy',
        price: 1.00,
        quantity: 50
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sweetData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should not create sweet with invalid data', async () => {
      const sweetData = {
        name: '',
        category: 'Candy',
        price: -1.00
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/sweets', () => {
    test('should get all sweets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets).toBeDefined();
      expect(Array.isArray(response.body.data.sweets)).toBe(true);
    });

    test('should not get sweets without authentication', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/sweets/:id', () => {
    test('should get sweet by ID', async () => {
      const response = await request(app)
        .get(`/api/sweets/${testSweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.id).toBe(testSweetId);
      expect(response.body.data.sweet.name).toBe('Test Chocolate');
    });

    test('should return 404 for non-existent sweet', async () => {
      const response = await request(app)
        .get('/api/sweets/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sweet not found');
    });
  });

  describe('PUT /api/sweets/:id', () => {
    test('should update sweet as admin', async () => {
      const updateData = {
        name: 'Updated Test Chocolate',
        price: 3.00
      };

      const response = await request(app)
        .put(`/api/sweets/${testSweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.name).toBe(updateData.name);
      expect(response.body.data.sweet.price).toBe(updateData.price);
    });

    test('should not update sweet as regular user', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/sweets/${testSweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/sweets/search', () => {
    test('should search sweets by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=Test')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.length).toBeGreaterThan(0);
      expect(response.body.data.sweets[0].name).toContain('Test');
    });

    test('should search sweets by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search?category=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.length).toBeGreaterThan(0);
    });

    test('should search sweets by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=2.00&maxPrice=4.00')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.every(sweet => sweet.price >= 2.00 && sweet.price <= 4.00)).toBe(true);
    });
  });

  describe('POST /api/sweets/:id/purchase', () => {
    test('should purchase sweet successfully', async () => {
      const purchaseData = { quantity: 2 };

      const response = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.purchase.quantity).toBe(2);
      expect(response.body.data.sweet.quantity).toBe(98); // 100 - 2
    });

    test('should not purchase more than available quantity', async () => {
      const purchaseData = { quantity: 200 };

      const response = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient stock');
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    test('should restock sweet as admin', async () => {
      const restockData = { quantity: 50 };

      const response = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.quantity).toBe(148); // 98 + 50
    });

    test('should not restock sweet as regular user', async () => {
      const restockData = { quantity: 10 };

      const response = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(restockData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    test('should delete sweet as admin', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${testSweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedId).toBe(testSweetId.toString());
    });

    test('should not delete sweet as regular user', async () => {
      // Create another sweet first
      const sweetResponse = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Delete Sweet',
          category: 'Test',
          price: 1.00,
          quantity: 10,
        });

      const response = await request(app)
        .delete(`/api/sweets/${sweetResponse.body.data.sweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });
});
