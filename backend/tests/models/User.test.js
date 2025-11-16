const database = require('../../config/database');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await global.dbHelpers.cleanupTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await global.dbHelpers.cleanupTestData();
  });

  describe('create', () => {
    test('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();

      // Verify password is properly hashed
      const isValidPassword = await bcrypt.compare(userData.password, user.password);
      expect(isValidPassword).toBe(true);
    });

    test('should create user with default role when not specified', async () => {
      const userData = {
        email: 'test-default@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user.role).toBe('user'); // Default role
    });

    test('should create admin user when role specified', async () => {
      const userData = {
        email: 'test-admin@example.com',
        password: 'password123',
        role: 'admin'
      };

      const user = await User.create(userData);

      expect(user.role).toBe('admin');
    });

    test('should throw error when creating user with duplicate email', async () => {
      const userData = {
        email: 'test-duplicate@example.com',
        password: 'password123'
      };

      // Create first user
      await User.create(userData);

      // Attempt to create duplicate
      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should throw error when creating user without required fields', async () => {
      const userData = {
        email: 'test-incomplete@example.com'
        // Missing password
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      // This should either throw an error or handle it gracefully
      // depending on your validation logic
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-find@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    test('should find user by valid ID', async () => {
      const found = await User.findById(testUser.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(testUser.id);
      expect(found.email).toBe('test-find@example.com');
      expect(found.password).toBeDefined(); // Password should be included
    });

    test('should return null for non-existent ID', async () => {
      const found = await User.findById(99999);
      expect(found).toBeNull();
    });

    test('should handle invalid ID types', async () => {
      const found = await User.findById('invalid');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-email@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    test('should find user by valid email', async () => {
      const found = await User.findByEmail('test-email@example.com');

      expect(found).toBeDefined();
      expect(found.id).toBe(testUser.id);
      expect(found.email).toBe('test-email@example.com');
      expect(found.password).toBeDefined();
    });

    test('should return null for non-existent email', async () => {
      const found = await User.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    test('should be case-sensitive for email', async () => {
      const found = await User.findByEmail('TEST-EMAIL@EXAMPLE.COM');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create multiple test users
      await User.create({
        email: 'test-user1@example.com',
        password: 'password123',
        role: 'user'
      });
      await User.create({
        email: 'test-admin1@example.com',
        password: 'password123',
        role: 'admin'
      });
    });

    test('should return all users without passwords', async () => {
      const users = await User.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(2);
      
      const testUsers = users.filter(u => u.email.includes('test-'));
      expect(testUsers.length).toBe(2);
      
      // Passwords should be excluded for security
      testUsers.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.email).toBeDefined();
        expect(user.role).toBeDefined();
      });
    });

    test('should return empty array when no users exist', async () => {
      // Clean all users
      await database.run('DELETE FROM users');
      
      const users = await User.findAll();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });

  describe('update', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-update@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    test('should update user email', async () => {
      const updateData = {
        email: 'test-updated@example.com'
      };

      const updated = await User.update(testUser.id, updateData);

      expect(updated.email).toBe(updateData.email);
      expect(updated.role).toBe(testUser.role); // Unchanged
      expect(updated.updated_at).not.toBe(testUser.updated_at);
    });

    test('should update user role', async () => {
      const updateData = {
        role: 'admin'
      };

      const updated = await User.update(testUser.id, updateData);

      expect(updated.role).toBe('admin');
      expect(updated.email).toBe(testUser.email); // Unchanged
    });

    test('should update password with hashing', async () => {
      const updateData = {
        password: 'newpassword456'
      };

      const updated = await User.update(testUser.id, updateData);

      expect(updated.password).not.toBe(updateData.password); // Should be hashed
      expect(updated.password).not.toBe(testUser.password); // Should be different

      // Verify new password works
      const isValidPassword = await bcrypt.compare(updateData.password, updated.password);
      expect(isValidPassword).toBe(true);
    });

    test('should throw error when updating non-existent user', async () => {
      const updateData = { email: 'nonexistent@example.com' };
      
      await expect(User.update(99999, updateData)).rejects.toThrow();
    });

    test('should throw error when updating to duplicate email', async () => {
      // Create another user
      await User.create({
        email: 'test-duplicate-target@example.com',
        password: 'password123'
      });

      const updateData = {
        email: 'test-duplicate-target@example.com'
      };

      await expect(User.update(testUser.id, updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-delete@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    test('should delete existing user successfully', async () => {
      const result = await User.delete(testUser.id);
      expect(result).toBe(true);

      // Verify deletion
      const found = await User.findById(testUser.id);
      expect(found).toBeNull();
    });

    test('should return false when deleting non-existent user', async () => {
      const result = await User.delete(99999);
      expect(result).toBe(false);
    });
  });

  describe('validatePassword', () => {
    let testUser;
    const originalPassword = 'password123';

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-validate@example.com',
        password: originalPassword,
        role: 'user'
      });
    });

    test('should validate correct password', async () => {
      const isValid = await User.validatePassword(testUser.id, originalPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const isValid = await User.validatePassword(testUser.id, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should return false for non-existent user', async () => {
      const isValid = await User.validatePassword(99999, originalPassword);
      expect(isValid).toBe(false);
    });

    test('should handle empty password', async () => {
      const isValid = await User.validatePassword(testUser.id, '');
      expect(isValid).toBe(false);
    });
  });

  describe('getUserStats', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test-stats@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    test('should return user statistics', async () => {
      const stats = await User.getUserStats(testUser.id);

      expect(stats).toBeDefined();
      expect(typeof stats.totalPurchases).toBe('number');
      expect(typeof stats.totalSpent).toBe('number');
      expect(Array.isArray(stats.favoriteCategories)).toBe(true);
    });

    test('should return zero stats for new user', async () => {
      const stats = await User.getUserStats(testUser.id);

      expect(stats.totalPurchases).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.favoriteCategories.length).toBe(0);
    });

    test('should return null for non-existent user', async () => {
      const stats = await User.getUserStats(99999);
      expect(stats).toBeNull();
    });
  });
});
