const request = require('supertest');
const app = require('../../server');
const database = require('../../config/database');
const User = require('../../models/User');
const Sweet = require('../../models/Sweet');
const jwt = require('jsonwebtoken');

describe('API Integration Tests', () => {
  let userToken;
  let adminToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    await database.connect();
    
    // Create test users
    testUser = await User.create({
      email: 'integration-user@sweetshop.com',
      password: 'password123',
      role: 'user'
    });

    testAdmin = await User.create({
      email: 'integration-admin@sweetshop.com',
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
    await global.dbHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await global.dbHelpers.cleanupTestData();
    await database.close();
  });

  describe('Complete Sweet Lifecycle', () => {
    test('should handle complete CRUD lifecycle for sweets', async () => {
      // 1. CREATE - Admin creates a new sweet
      const sweetData = global.testUtils.createTestSweetData({
        name: 'Integration Test Sweet',
        category: 'Chocolate',
        price: 3.99,
        quantity: 50
      });

      const createResponse = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData)
        .expect(201);

      global.testUtils.validateApiResponse(createResponse, ['sweet']);
      const sweetId = createResponse.body.data.sweet.id;
      expect(sweetId).toBeDefined();

      // 2. READ - User retrieves the sweet
      const getResponse = await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getResponse.body.data.sweet.name).toBe(sweetData.name);
      expect(getResponse.body.data.sweet.price).toBe(sweetData.price);

      // 3. UPDATE - Admin updates the sweet
      const updateData = {
        name: 'Updated Integration Sweet',
        price: 4.99,
        quantity: 75
      };

      const updateResponse = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.sweet.name).toBe(updateData.name);
      expect(updateResponse.body.data.sweet.price).toBe(updateData.price);

      // 4. SEARCH - User searches for the updated sweet
      const searchResponse = await request(app)
        .get('/api/sweets/search?name=Updated')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(searchResponse.body.data.sweets.length).toBe(1);
      expect(searchResponse.body.data.sweets[0].id).toBe(sweetId);

      // 5. PURCHASE - User purchases some quantity
      const purchaseResponse = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 })
        .expect(200);

      expect(purchaseResponse.body.data.sweet.quantity).toBe(65); // 75 - 10

      // 6. RESTOCK - Admin restocks the sweet
      const restockResponse = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 25 })
        .expect(200);

      expect(restockResponse.body.data.sweet.quantity).toBe(90); // 65 + 25

      // 7. DELETE - Admin deletes the sweet
      const deleteResponse = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.data.deletedId).toBe(sweetId.toString());

      // 8. VERIFY DELETION - Sweet should not be found
      await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('User Authentication Flow', () => {
    test('should handle complete user registration and login flow', async () => {
      const userData = {
        email: 'integration-flow@example.com',
        password: 'password123'
      };

      // 1. REGISTER - New user registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      global.testUtils.validateApiResponse(registerResponse, ['user', 'token']);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data.token).toHaveValidJWTStructure();

      // 2. LOGIN - User login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      global.testUtils.validateApiResponse(loginResponse, ['user', 'token']);
      expect(loginResponse.body.data.user.email).toBe(userData.email);
      expect(loginResponse.body.data.token).toHaveValidJWTStructure();

      // 3. ACCESS PROTECTED ROUTE - Use token to access protected endpoint
      const token = loginResponse.body.data.token;
      const protectedResponse = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      global.testUtils.validateApiResponse(protectedResponse, ['sweets']);
    });
  });

  describe('Inventory Management Flow', () => {
    let sweetId;

    beforeEach(async () => {
      // Create a test sweet for inventory operations
      const sweet = await Sweet.create(global.testUtils.createTestSweetData({
        name: 'Inventory Test Sweet',
        quantity: 100
      }));
      sweetId = sweet.id;
    });

    test('should handle complete inventory management workflow', async () => {
      // 1. CHECK INITIAL INVENTORY
      const initialResponse = await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(initialResponse.body.data.sweet.quantity).toBe(100);

      // 2. MULTIPLE PURCHASES by different users
      const purchases = [
        { quantity: 10 },
        { quantity: 15 },
        { quantity: 5 }
      ];

      for (const purchase of purchases) {
        await request(app)
          .post(`/api/sweets/${sweetId}/purchase`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(purchase)
          .expect(200);
      }

      // 3. CHECK INVENTORY AFTER PURCHASES
      const afterPurchaseResponse = await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(afterPurchaseResponse.body.data.sweet.quantity).toBe(70); // 100 - 30

      // 4. RESTOCK INVENTORY
      await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 })
        .expect(200);

      // 5. VERIFY FINAL INVENTORY
      const finalResponse = await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalResponse.body.data.sweet.quantity).toBe(120); // 70 + 50

      // 6. CHECK INVENTORY LOGS
      const logsResponse = await request(app)
        .get(`/api/inventory/logs?sweetId=${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(logsResponse.body.data.logs.length).toBeGreaterThanOrEqual(4); // 3 purchases + 1 restock
    });

    test('should handle out-of-stock scenarios', async () => {
      // Purchase all available quantity
      await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 100 })
        .expect(200);

      // Attempt to purchase when out of stock
      await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1 })
        .expect(400);

      // Verify sweet is out of stock
      const response = await request(app)
        .get(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.sweet.quantity).toBe(0);
    });
  });

  describe('Search and Filter Integration', () => {
    beforeEach(async () => {
      // Create test data for search scenarios
      const testSweets = [
        { name: 'Dark Chocolate Bar', category: 'Chocolate', price: 4.99, quantity: 20 },
        { name: 'Milk Chocolate Truffle', category: 'Chocolate', price: 2.99, quantity: 50 },
        { name: 'Strawberry Gummy Bears', category: 'Gummy', price: 1.99, quantity: 0 },
        { name: 'Vanilla Caramel Fudge', category: 'Fudge', price: 3.49, quantity: 30 },
        { name: 'Rainbow Lollipop', category: 'Lollipop', price: 0.99, quantity: 100 }
      ];

      for (const sweetData of testSweets) {
        await Sweet.create(global.testUtils.createTestSweetData(sweetData));
      }
    });

    test('should handle complex search scenarios', async () => {
      // 1. SEARCH BY NAME
      const nameSearchResponse = await request(app)
        .get('/api/sweets/search?name=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(nameSearchResponse.body.data.sweets.length).toBe(2);
      expect(nameSearchResponse.body.data.sweets.every(s => s.name.includes('Chocolate'))).toBe(true);

      // 2. SEARCH BY CATEGORY
      const categorySearchResponse = await request(app)
        .get('/api/sweets/search?category=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(categorySearchResponse.body.data.sweets.length).toBe(2);
      expect(categorySearchResponse.body.data.sweets.every(s => s.category === 'Chocolate')).toBe(true);

      // 3. SEARCH BY PRICE RANGE
      const priceSearchResponse = await request(app)
        .get('/api/sweets/search?minPrice=2.00&maxPrice=4.00')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(priceSearchResponse.body.data.sweets.every(s => s.price >= 2.00 && s.price <= 4.00)).toBe(true);

      // 4. SEARCH FOR IN-STOCK ITEMS ONLY
      const inStockSearchResponse = await request(app)
        .get('/api/sweets/search?inStock=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(inStockSearchResponse.body.data.sweets.every(s => s.quantity > 0)).toBe(true);

      // 5. COMBINED SEARCH CRITERIA
      const combinedSearchResponse = await request(app)
        .get('/api/sweets/search?category=Chocolate&minPrice=3.00&inStock=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const results = combinedSearchResponse.body.data.sweets;
      expect(results.every(s => 
        s.category === 'Chocolate' && 
        s.price >= 3.00 && 
        s.quantity > 0
      )).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent operations gracefully', async () => {
      // Create a sweet with limited quantity
      const sweet = await Sweet.create(global.testUtils.createTestSweetData({
        name: 'Concurrent Test Sweet',
        quantity: 10
      }));

      // Attempt multiple concurrent purchases
      const purchasePromises = Array(5).fill().map(() =>
        request(app)
          .post(`/api/sweets/${sweet.id}/purchase`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ quantity: 3 })
      );

      const responses = await Promise.allSettled(purchisePromises);
      
      // Some should succeed, some should fail due to insufficient stock
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const failed = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 400
      ).length;

      expect(successful + failed).toBe(5);
      expect(successful).toBeLessThanOrEqual(3); // Max 3 purchases of 3 items each from 10 total
    });

    test('should maintain data consistency during failures', async () => {
      const sweet = await Sweet.create(global.testUtils.createTestSweetData({
        name: 'Consistency Test Sweet',
        quantity: 50
      }));

      const initialQuantity = sweet.quantity;

      // Valid purchase
      await request(app)
        .post(`/api/sweets/${sweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 })
        .expect(200);

      // Invalid purchase (should fail)
      await request(app)
        .post(`/api/sweets/${sweet.id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 100 }) // More than available
        .expect(400);

      // Verify quantity is correct after failed operation
      const finalResponse = await request(app)
        .get(`/api/sweets/${sweet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalResponse.body.data.sweet.quantity).toBe(40); // 50 - 10, failed purchase didn't affect quantity
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple simultaneous requests efficiently', async () => {
      // Create test sweets
      const sweets = [];
      for (let i = 0; i < 10; i++) {
        const sweet = await Sweet.create(global.testUtils.createTestSweetData({
          name: `Performance Test Sweet ${i}`,
          quantity: 100
        }));
        sweets.push(sweet);
      }

      // Measure time for concurrent requests
      const { duration } = await global.perfHelpers.measureTime(async () => {
        const promises = sweets.map(sweet =>
          request(app)
            .get(`/api/sweets/${sweet.id}`)
            .set('Authorization', `Bearer ${userToken}`)
        );

        const responses = await Promise.all(promises);
        
        // Verify all requests succeeded
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        return responses;
      });

      // Assert reasonable performance (adjust threshold as needed)
      global.perfHelpers.assertExecutionTime(duration, 5000); // 5 seconds max
    });

    test('should handle large search results efficiently', async () => {
      // Create many test sweets
      const sweetPromises = [];
      for (let i = 0; i < 50; i++) {
        sweetPromises.push(
          Sweet.create(global.testUtils.createTestSweetData({
            name: `Bulk Test Sweet ${i}`,
            category: 'Chocolate',
            price: Math.random() * 10 + 1
          }))
        );
      }
      await Promise.all(sweetPromises);

      // Measure search performance
      const { result, duration } = await global.perfHelpers.measureTime(async () => {
        return request(app)
          .get('/api/sweets/search?category=Chocolate')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      });

      expect(result.body.data.sweets.length).toBeGreaterThanOrEqual(50);
      global.perfHelpers.assertExecutionTime(duration, 2000); // 2 seconds max
    });
  });

  describe('Security Integration Tests', () => {
    test('should prevent unauthorized access to admin endpoints', async () => {
      const sweetData = global.testUtils.createTestSweetData();

      // Regular user should not be able to create sweets
      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sweetData)
        .expect(403);

      // Unauthenticated request should fail
      await request(app)
        .post('/api/sweets')
        .send(sweetData)
        .expect(401);
    });

    test('should validate input data properly', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        category: 'DROP TABLE sweets;',
        price: 'invalid',
        quantity: -1
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    test('should handle token manipulation attempts', async () => {
      // Tampered token
      const tamperedToken = userToken.slice(0, -5) + 'XXXXX';
      
      await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      // Expired token simulation
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});
