const User = require('../../models/User');
const { database } = require('../setup');

describe('User Model - Core Features', () => {
  describe('Create User', () => {
    it('should create a new user with valid data', async () => {
      const userData = testUtils.createTestUser();
      
      const user = await User.create(userData);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = testUtils.createTestUser();
      
      // Create first user
      await User.create(userData);
      
      // Try to create second user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail to create user with invalid email', async () => {
      const userData = testUtils.createTestUser();
      userData.email = 'invalid-email';
      
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail to create user with short password', async () => {
      const userData = testUtils.createTestUser();
      userData.password = '123'; // Too short
      
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Find User', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      testUser = await User.create(userData);
    });

    it('should find user by id', async () => {
      const found = await User.findById(testUser.id);
      
      expect(found).toBeDefined();
      expect(found.id).toBe(testUser.id);
      expect(found.email).toBe(testUser.email);
    });

    it('should find user by email', async () => {
      const found = await User.findByEmail(testUser.email);
      
      expect(found).toBeDefined();
      expect(found.id).toBe(testUser.id);
      expect(found.email).toBe(testUser.email);
    });

    it('should return null for non-existent user', async () => {
      const found = await User.findById(99999);
      expect(found).toBeNull();
      
      const foundByEmail = await User.findByEmail('nonexistent@example.com');
      expect(foundByEmail).toBeNull();
    });
  });

  describe('Password Validation', () => {
    let testUser;
    const originalPassword = 'password123';

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      userData.password = originalPassword;
      testUser = await User.create(userData);
    });

    it('should validate correct password', async () => {
      const isValid = await User.validatePassword(testUser.email, originalPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await User.validatePassword(testUser.email, 'wrongpassword');
      
      expect(isValid).toBe(false);
    });

    it('should reject password for non-existent user', async () => {
      const isValid = await User.validatePassword('nonexistent@example.com', originalPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Update User', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      testUser = await User.create(userData);
    });

    it('should update user role', async () => {
      const updated = await User.update(testUser.id, { role: 'admin' });
      
      expect(updated).toBeDefined();
      expect(updated.role).toBe('admin');
      expect(updated.id).toBe(testUser.id);
    });

    it('should fail to update with invalid role', async () => {
      await expect(User.update(testUser.id, { role: 'invalid' })).rejects.toThrow();
    });
  });
});
