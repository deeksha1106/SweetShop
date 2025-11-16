const request = require('supertest');
const app = require('../../server');
const { database } = require('../setup');

describe('API Integration - Core Features', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Create and authenticate a test user
    const userData = testUtils.createTestUser();
    
    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(registerResponse.status).toBe(201);
    testUser = registerResponse.body.data.user;
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.data.token;
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const userData = testUtils.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      const userData = testUtils.createTestUser();
      
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Sweet Endpoints', () => {
    let testSweet;

    beforeEach(async () => {
      // Create a test sweet for admin operations
      const sweetData = testUtils.createTestSweet();
      
      // Update user to admin for sweet creation
      await database.run('UPDATE users SET role = ? WHERE id = ?', ['admin', testUser.id]);
      
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sweetData);
      
      expect(response.status).toBe(201);
      testSweet = response.body.data;
    });

    it('should get all sweets', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get sweet by id', async () => {
      const response = await request(app)
        .get(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSweet.id);
    });

    it('should create new sweet (admin only)', async () => {
      const sweetData = testUtils.createTestSweet();
      
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sweetData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(sweetData.name);
    });

    it('should update sweet (admin only)', async () => {
      const updateData = { price: 9.99 };
      
      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should purchase sweet', async () => {
      // Change user back to regular user for purchase
      await database.run('UPDATE users SET role = ? WHERE id = ?', ['user', testUser.id]);
      
      const purchaseData = {
        sweet_id: testSweet.id,
        quantity: 2
      };
      
      const response = await request(app)
        .post('/api/sweets/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(purchaseData.quantity);
    });

    it('should reject unauthorized sweet creation', async () => {
      // Change user to regular user
      await database.run('UPDATE users SET role = ? WHERE id = ?', ['user', testUser.id]);
      
      const sweetData = testUtils.createTestSweet();
      
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sweetData);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/sweets');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid sweet id', async () => {
      const response = await request(app)
        .get('/api/sweets/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('invalid json')
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(400);
    });
  });
});
