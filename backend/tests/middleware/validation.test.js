const request = require('supertest');
const express = require('express');
const { 
  validateSweetData, 
  validateUserData, 
  validatePurchaseData,
  validateRestockData 
} = require('../../middleware/validation');

// Create test apps for each validation middleware
const createSweetValidationApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/sweets', validateSweetData, (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  return app;
};

const createUserValidationApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/users', validateUserData, (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  return app;
};

const createPurchaseValidationApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/purchase', validatePurchaseData, (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  return app;
};

const createRestockValidationApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/restock', validateRestockData, (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  return app;
};

describe('Validation Middleware', () => {
  describe('validateSweetData', () => {
    let app;

    beforeAll(() => {
      app = createSweetValidationApp();
    });

    test('should accept valid sweet data', async () => {
      const validData = {
        name: 'Chocolate Truffle',
        category: 'Chocolate',
        price: 2.50,
        quantity: 100,
        description: 'Rich chocolate truffle',
        image_url: '/images/truffle.jpg'
      };

      const response = await request(app)
        .post('/sweets')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validData.name);
    });

    test('should accept minimal valid data', async () => {
      const minimalData = {
        name: 'Simple Sweet',
        category: 'Candy',
        price: 1.00
      };

      const response = await request(app)
        .post('/sweets')
        .send(minimalData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject empty name', async () => {
      const invalidData = {
        name: '',
        category: 'Chocolate',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('Name is required');
    });

    test('should reject missing name', async () => {
      const invalidData = {
        category: 'Chocolate',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Name is required');
    });

    test('should reject name that is too long', async () => {
      const invalidData = {
        name: 'x'.repeat(256), // Assuming max length is 255
        category: 'Chocolate',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Name must be less than 255 characters');
    });

    test('should reject empty category', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: '',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Category is required');
    });

    test('should reject missing category', async () => {
      const invalidData = {
        name: 'Test Sweet',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Category is required');
    });

    test('should reject negative price', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: -1.00
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Price must be a positive number');
    });

    test('should reject zero price', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 0
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Price must be a positive number');
    });

    test('should reject missing price', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate'
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Price is required');
    });

    test('should reject non-numeric price', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 'expensive'
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Price must be a number');
    });

    test('should reject negative quantity', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 2.50,
        quantity: -5
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a non-negative number');
    });

    test('should accept zero quantity', async () => {
      const validData = {
        name: 'Out of Stock Sweet',
        category: 'Chocolate',
        price: 2.50,
        quantity: 0
      };

      const response = await request(app)
        .post('/sweets')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject non-integer quantity', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 2.50,
        quantity: 5.5
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be an integer');
    });

    test('should reject description that is too long', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 2.50,
        description: 'x'.repeat(1001) // Assuming max length is 1000
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Description must be less than 1000 characters');
    });

    test('should validate image URL format', async () => {
      const invalidData = {
        name: 'Test Sweet',
        category: 'Chocolate',
        price: 2.50,
        image_url: 'not-a-url'
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Image URL must be a valid URL or path');
    });

    test('should accept valid image URLs', async () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.png',
        '/images/local-image.jpg',
        './relative/image.gif'
      ];

      for (const url of validUrls) {
        const validData = {
          name: 'Test Sweet',
          category: 'Chocolate',
          price: 2.50,
          image_url: url
        };

        await request(app)
          .post('/sweets')
          .send(validData)
          .expect(200);
      }
    });
  });

  describe('validateUserData', () => {
    let app;

    beforeAll(() => {
      app = createUserValidationApp();
    });

    test('should accept valid user data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should accept minimal valid data', async () => {
      const minimalData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(minimalData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Email must be a valid email address');
    });

    test('should reject missing email', async () => {
      const invalidData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Email is required');
    });

    test('should reject empty email', async () => {
      const invalidData = {
        email: '',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Email is required');
    });

    test('should reject short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Password must be at least 6 characters long');
    });

    test('should reject missing password', async () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Password is required');
    });

    test('should reject empty password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Password is required');
    });

    test('should reject invalid role', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Role must be either "user" or "admin"');
    });

    test('should accept valid roles', async () => {
      const validRoles = ['user', 'admin'];

      for (const role of validRoles) {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          role: role
        };

        await request(app)
          .post('/users')
          .send(validData)
          .expect(200);
      }
    });
  });

  describe('validatePurchaseData', () => {
    let app;

    beforeAll(() => {
      app = createPurchaseValidationApp();
    });

    test('should accept valid purchase data', async () => {
      const validData = {
        quantity: 5
      };

      const response = await request(app)
        .post('/purchase')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing quantity', async () => {
      const invalidData = {};

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity is required');
    });

    test('should reject zero quantity', async () => {
      const invalidData = {
        quantity: 0
      };

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a positive integer');
    });

    test('should reject negative quantity', async () => {
      const invalidData = {
        quantity: -5
      };

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a positive integer');
    });

    test('should reject non-integer quantity', async () => {
      const invalidData = {
        quantity: 2.5
      };

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be an integer');
    });

    test('should reject non-numeric quantity', async () => {
      const invalidData = {
        quantity: 'five'
      };

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a number');
    });

    test('should reject extremely large quantity', async () => {
      const invalidData = {
        quantity: 1000000
      };

      const response = await request(app)
        .post('/purchase')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be less than 10000');
    });
  });

  describe('validateRestockData', () => {
    let app;

    beforeAll(() => {
      app = createRestockValidationApp();
    });

    test('should accept valid restock data', async () => {
      const validData = {
        quantity: 50
      };

      const response = await request(app)
        .post('/restock')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing quantity', async () => {
      const invalidData = {};

      const response = await request(app)
        .post('/restock')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity is required');
    });

    test('should reject zero quantity', async () => {
      const invalidData = {
        quantity: 0
      };

      const response = await request(app)
        .post('/restock')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a positive integer');
    });

    test('should reject negative quantity', async () => {
      const invalidData = {
        quantity: -10
      };

      const response = await request(app)
        .post('/restock')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Quantity must be a positive integer');
    });

    test('should accept large restock quantities', async () => {
      const validData = {
        quantity: 5000
      };

      const response = await request(app)
        .post('/restock')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    let app;

    beforeAll(() => {
      app = createSweetValidationApp();
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/sweets')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/sweets')
        .send()
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toContain('Name is required');
    });

    test('should handle null values', async () => {
      const invalidData = {
        name: null,
        category: null,
        price: null
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Name is required');
      expect(response.body.details).toContain('Category is required');
      expect(response.body.details).toContain('Price is required');
    });

    test('should handle undefined values', async () => {
      const invalidData = {
        name: undefined,
        category: 'Chocolate',
        price: 2.50
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toContain('Name is required');
    });

    test('should trim whitespace from string fields', async () => {
      const dataWithWhitespace = {
        name: '  Chocolate Truffle  ',
        category: '  Chocolate  ',
        price: 2.50,
        description: '  Rich chocolate  '
      };

      const response = await request(app)
        .post('/sweets')
        .send(dataWithWhitespace)
        .expect(200);

      expect(response.body.data.name).toBe('Chocolate Truffle');
      expect(response.body.data.category).toBe('Chocolate');
      expect(response.body.data.description).toBe('Rich chocolate');
    });

    test('should handle multiple validation errors', async () => {
      const invalidData = {
        name: '',
        category: '',
        price: -1,
        quantity: -5
      };

      const response = await request(app)
        .post('/sweets')
        .send(invalidData)
        .expect(400);

      expect(response.body.details.length).toBeGreaterThan(1);
      expect(response.body.details).toContain('Name is required');
      expect(response.body.details).toContain('Category is required');
      expect(response.body.details).toContain('Price must be a positive number');
      expect(response.body.details).toContain('Quantity must be a non-negative number');
    });
  });
});
