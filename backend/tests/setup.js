const database = require('../config/database');
const { createTables } = require('../scripts/migrate');
const fs = require('fs');
const path = require('path');

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.DB_PATH = './database/test-sweetshop.db';
  
  // Increase timeout for database operations
  jest.setTimeout(30000);
  
  // Ensure clean test database
  const testDbPath = path.resolve('./database/test-sweetshop.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  // Connect to fresh database
  await database.connect();
  
  // Create database tables for testing
  await createTables();
  
  // Enable foreign keys
  await database.run('PRAGMA foreign_keys = ON');
});

// Global test teardown
afterAll(async () => {
  try {
    await database.close();
  } catch (error) {
    // Ignore close errors in tests
  }
});

// Provide db helper utilities for tests expecting global.dbHelpers
global.dbHelpers = {
  cleanupTestData: async () => {
    try {
      await database.run('DELETE FROM inventory_logs');
      await database.run('DELETE FROM purchases');
      await database.run('DELETE FROM sweets');
      await database.run('DELETE FROM users');
    } catch (e) {
      // ignore
    }
  }
};

// Clean up test data between tests (default path)
beforeEach(async () => {
  await global.dbHelpers.cleanupTestData();
});

// Essential test utilities
global.testUtils = {
  createTestUser: () => ({
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'user'
  }),
  
  createTestSweet: () => ({
    name: `Test Sweet ${Date.now()}`,
    category: 'Chocolate',
    price: 2.50,
    quantity: 100,
    description: 'Test sweet description'
  })
};

// Export database for tests
module.exports = { database };
