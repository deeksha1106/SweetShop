const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const database = require('../../config/database');
const User = require('../../models/User');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Test routes
  app.get('/protected', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
  });
  
  app.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
  });
  
  return app;
};

describe('Authentication Middleware', () => {
  let app;
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;
  let expiredToken;

  beforeAll(async () => {
    await database.connect();
    app = createTestApp();
    
    // Create test users
    testUser = await User.create({
      email: 'testuser-middleware@sweetshop.com',
      password: 'password123',
      role: 'user'
    });

    testAdmin = await User.create({
      email: 'testadmin-middleware@sweetshop.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'test-secret';
    
    userToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      secret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: testAdmin.id, role: testAdmin.role },
      secret,
      { expiresIn: '1h' }
    );

    // Create an expired token
    expiredToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      secret,
      { expiresIn: '-1h' } // Already expired
    );
  });

  afterAll(async () => {
    // Cleanup
    await database.run('DELETE FROM users WHERE email LIKE "%test%"');
    await database.close();
  });

  describe('authenticateToken middleware', () => {
    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe(testUser.id);
      expect(response.body.user.role).toBe('user');
    });

    test('should allow access with valid admin token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe(testAdmin.id);
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject request with expired token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject token with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle empty Bearer token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should handle token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', userToken)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should handle multiple Authorization headers', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', [`Bearer ${userToken}`, 'Bearer another-token'])
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('requireAdmin middleware', () => {
    test('should allow access for admin user', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    test('should deny access for regular user', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    test('should require authentication first', async () => {
      const response = await request(app)
        .get('/admin-only')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should handle case-sensitive role check', async () => {
      // Create token with uppercase role
      const uppercaseRoleToken = jwt.sign(
        { userId: testUser.id, role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${uppercaseRoleToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('should handle missing role in token', async () => {
      const noRoleToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${noRoleToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('Token payload validation', () => {
    test('should handle token without userId', async () => {
      const invalidToken = jwt.sign(
        { role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle token with invalid userId type', async () => {
      const invalidToken = jwt.sign(
        { userId: 'not-a-number', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(200); // Should still work, validation happens at application level

      expect(response.body.user.userId).toBe('not-a-number');
    });

    test('should handle token with extra claims', async () => {
      const tokenWithExtra = jwt.sign(
        { 
          userId: testUser.id, 
          role: testUser.role,
          extra: 'data',
          permissions: ['read', 'write']
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tokenWithExtra}`)
        .expect(200);

      expect(response.body.user.userId).toBe(testUser.id);
      expect(response.body.user.extra).toBe('data');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle malformed JWT', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle JWT with invalid JSON', async () => {
      // Create a token-like string that's not valid JSON when decoded
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-json.signature';
      
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle very long token', async () => {
      const longPayload = {
        userId: testUser.id,
        role: testUser.role,
        longData: 'x'.repeat(10000) // Very long string
      };

      const longToken = jwt.sign(
        longPayload,
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(200);

      expect(response.body.user.userId).toBe(testUser.id);
    });

    test('should handle concurrent requests with same token', async () => {
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.user.userId).toBe(testUser.id);
      });
    });

    test('should handle requests with different token formats', async () => {
      const testCases = [
        'bearer ' + userToken, // lowercase bearer
        'BEARER ' + userToken, // uppercase bearer
        ' Bearer ' + userToken, // extra spaces
        'Bearer  ' + userToken, // multiple spaces
      ];

      for (const authHeader of testCases) {
        const response = await request(app)
          .get('/protected')
          .set('Authorization', authHeader)
          .expect(401); // All should fail due to strict format checking

        expect(response.body.error).toBe('Access token required');
      }
    });
  });

  describe('Security considerations', () => {
    test('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
      expect(response.body.error).not.toContain('secret');
      expect(response.body.error).not.toContain('jwt');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('should handle token reuse after user role change', async () => {
      // This token was created when user was 'user' role
      // If user role changes to admin, old token should still work with old role
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user.role).toBe('user');
    });

    test('should validate token signature integrity', async () => {
      // Tamper with token signature
      const tamperedToken = userToken.slice(0, -5) + 'XXXXX';
      
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });
});
