const database = require('../../config/database');
const Sweet = require('../../models/Sweet');
const User = require('../../models/User');

describe('Sweet Model', () => {
  let testUserId;
  
  beforeEach(async () => {
    // Clean up test data before each test
    await global.dbHelpers.cleanupTestData();
    
    // Create test user for purchase/restock tests
    const testUser = await User.create({
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user'
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Final cleanup
    await global.dbHelpers.cleanupTestData();
  });

  describe('create', () => {
    test('should create a new sweet with all fields', async () => {
      const sweetData = {
        name: 'Test Chocolate Truffle',
        category: 'Chocolate',
        price: 2.50,
        quantity: 100,
        description: 'Rich chocolate truffle',
        image_url: '/images/test-truffle.jpg'
      };

      const sweet = await Sweet.create(sweetData);

      expect(sweet).toBeDefined();
      expect(sweet.id).toBeDefined();
      expect(sweet.name).toBe(sweetData.name);
      expect(sweet.category).toBe(sweetData.category);
      expect(sweet.price).toBe(sweetData.price);
      expect(sweet.quantity).toBe(sweetData.quantity);
      expect(sweet.description).toBe(sweetData.description);
      expect(sweet.image_url).toBe(sweetData.image_url);
      expect(sweet.created_at).toBeDefined();
      expect(sweet.updated_at).toBeDefined();
    });

    test('should create sweet with minimal required fields', async () => {
      const sweetData = {
        name: 'Test Minimal Sweet',
        category: 'Candy',
        price: 1.00
      };

      const sweet = await Sweet.create(sweetData);

      expect(sweet).toBeDefined();
      expect(sweet.name).toBe(sweetData.name);
      expect(sweet.category).toBe(sweetData.category);
      expect(sweet.price).toBe(sweetData.price);
      expect(sweet.quantity).toBe(0); // Default value
      expect(sweet.description).toBeNull();
      expect(sweet.image_url).toBeNull();
    });

    test('should throw error when creating sweet without required fields', async () => {
      const sweetData = {
        name: 'Test Invalid Sweet'
        // Missing category and price
      };

      await expect(Sweet.create(sweetData)).rejects.toThrow();
    });

    test('should handle negative price validation', async () => {
      const sweetData = {
        name: 'Test Negative Price',
        category: 'Candy',
        price: -1.00
      };

      // Should throw an error for negative prices
      await expect(Sweet.create(sweetData)).rejects.toThrow('Invalid price');
    });
  });

  describe('findById', () => {
    let testSweet;

    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Find Sweet',
        category: 'Chocolate',
        price: 3.00,
        quantity: 50
      });
    });

    test('should find sweet by valid ID', async () => {
      const found = await Sweet.findById(testSweet.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(testSweet.id);
      expect(found.name).toBe('Test Find Sweet');
    });

    test('should return null for non-existent ID', async () => {
      const found = await Sweet.findById(99999);
      expect(found).toBeNull();
    });

    test('should handle invalid ID types', async () => {
      const found = await Sweet.findById('invalid');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create multiple test sweets with delay to ensure different timestamps
      await Sweet.create({
        name: 'Test Sweet 1',
        category: 'Chocolate',
        price: 2.00,
        quantity: 10
      });
      // Add delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      await Sweet.create({
        name: 'Test Sweet 2',
        category: 'Candy',
        price: 1.50,
        quantity: 20
      });
    });

    test('should return all sweets ordered by created_at DESC', async () => {
      const sweets = await Sweet.findAll();

      expect(Array.isArray(sweets)).toBe(true);
      expect(sweets.length).toBeGreaterThanOrEqual(2);
      
      // Check ordering (most recent first)
      const testSweets = sweets.filter(s => s.name.includes('Test Sweet'));
      expect(testSweets.length).toBe(2);
      expect(testSweets[0].name).toBe('Test Sweet 2'); // Created later
      expect(testSweets[1].name).toBe('Test Sweet 1'); // Created first
    });

    test('should return empty array when no sweets exist', async () => {
      // Clean all sweets
      await database.run('DELETE FROM sweets');
      
      const sweets = await Sweet.findAll();
      expect(Array.isArray(sweets)).toBe(true);
      expect(sweets.length).toBe(0);
    });
  });

  describe('update', () => {
    let testSweet;

    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Update Sweet',
        category: 'Chocolate',
        price: 2.00,
        quantity: 30,
        description: 'Original description'
      });
    });

    test('should update all fields successfully', async () => {
      const updateData = {
        name: 'Updated Test Sweet',
        category: 'Candy',
        price: 3.50,
        quantity: 50,
        description: 'Updated description',
        image_url: '/images/updated.jpg'
      };

      const updated = await Sweet.update(testSweet.id, updateData);

      expect(updated.name).toBe(updateData.name);
      expect(updated.category).toBe(updateData.category);
      expect(updated.price).toBe(updateData.price);
      expect(updated.quantity).toBe(updateData.quantity);
      expect(updated.description).toBe(updateData.description);
      expect(updated.image_url).toBe(updateData.image_url);
      expect(updated.updated_at).not.toBe(testSweet.updated_at);
    });

    test('should update partial fields', async () => {
      const updateData = {
        name: 'Partially Updated Sweet',
        price: 4.00
      };

      const updated = await Sweet.update(testSweet.id, updateData);

      expect(updated.name).toBe(updateData.name);
      expect(updated.price).toBe(updateData.price);
      expect(updated.category).toBe(testSweet.category); // Unchanged
      expect(updated.quantity).toBe(testSweet.quantity); // Unchanged
    });

    test('should throw error when updating non-existent sweet', async () => {
      const updateData = { name: 'Non-existent' };
      
      await expect(Sweet.update(99999, updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    let testSweet;

    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Delete Sweet',
        category: 'Chocolate',
        price: 2.00,
        quantity: 10
      });
    });

    test('should delete existing sweet successfully', async () => {
      const result = await Sweet.delete(testSweet.id);
      expect(result).toBe(true);

      // Verify deletion
      const found = await Sweet.findById(testSweet.id);
      expect(found).toBeNull();
    });

    test('should return false when deleting non-existent sweet', async () => {
      const result = await Sweet.delete(99999);
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test data for search
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
        quantity: 0 // Out of stock
      });
      await Sweet.create({
        name: 'Test Chocolate Truffle',
        category: 'Chocolate',
        price: 4.50,
        quantity: 15
      });
    });

    test('should search by name', async () => {
      const results = await Sweet.search({ name: 'Chocolate' });
      
      expect(results.length).toBe(2);
      expect(results.every(s => s.name.includes('Chocolate'))).toBe(true);
    });

    test('should search by category', async () => {
      const results = await Sweet.search({ category: 'Chocolate' });
      
      expect(results.length).toBe(2);
      expect(results.every(s => s.category === 'Chocolate')).toBe(true);
    });

    test('should search by price range', async () => {
      const results = await Sweet.search({ minPrice: 2.00, maxPrice: 4.00 });
      
      expect(results.length).toBe(1);
      expect(results[0].price).toBe(3.00);
    });

    test('should search for in-stock items only', async () => {
      const results = await Sweet.search({ inStock: true });
      
      expect(results.length).toBe(2);
      expect(results.every(s => s.quantity > 0)).toBe(true);
    });

    test('should combine multiple search criteria', async () => {
      const results = await Sweet.search({
        category: 'Chocolate',
        minPrice: 4.00,
        inStock: true
      });
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Test Chocolate Truffle');
    });

    test('should return empty array when no matches found', async () => {
      const results = await Sweet.search({ name: 'NonExistent' });
      expect(results.length).toBe(0);
    });
  });

  describe('purchase', () => {
    let testSweet;

    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Purchase Sweet',
        category: 'Chocolate',
        price: 2.50,
        quantity: 100
      });
    });

    test('should purchase sweet successfully', async () => {
      const result = await Sweet.purchase(testSweet.id, 5, testUserId);

      expect(result.sweet.quantity).toBe(95); // 100 - 5
      expect(result.purchase.quantity).toBe(5);
      expect(result.purchase.totalPrice).toBe(12.50); // 2.50 * 5
      expect(result.purchase.remainingStock).toBe(95);
    });

    test('should throw error when insufficient stock', async () => {
      await expect(Sweet.purchase(testSweet.id, 150, testUserId))
        .rejects.toThrow('Insufficient quantity in stock');
    });

    test('should throw error when sweet not found', async () => {
      await expect(Sweet.purchase(99999, 1, testUserId))
        .rejects.toThrow('Sweet not found');
    });

    test('should handle exact quantity purchase', async () => {
      const result = await Sweet.purchase(testSweet.id, 100, testUserId);
      
      expect(result.sweet.quantity).toBe(0);
      expect(result.purchase.remainingStock).toBe(0);
    });
  });

  describe('restock', () => {
    let testSweet;

    beforeEach(async () => {
      testSweet = await Sweet.create({
        name: 'Test Restock Sweet',
        category: 'Chocolate',
        price: 2.50,
        quantity: 10
      });
    });

    test('should restock sweet successfully', async () => {
      const result = await Sweet.restock(testSweet.id, 50, testUserId);

      expect(result.quantity).toBe(60); // 10 + 50
    });

    test('should throw error when sweet not found', async () => {
      await expect(Sweet.restock(99999, 10, testUserId))
        .rejects.toThrow('Sweet not found');
    });

    test('should handle zero quantity restock', async () => {
      const result = await Sweet.restock(testSweet.id, 0, testUserId);
      expect(result.quantity).toBe(10); // No change
    });
  });

  describe('getCategories', () => {
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
      await Sweet.create({
        name: 'Test Cat 3',
        category: 'Chocolate', // Duplicate
        price: 1.00
      });
    });

    test('should return unique categories in alphabetical order', async () => {
      const categories = await Sweet.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('Chocolate');
      expect(categories).toContain('Candy');
      
      // Should be unique (no duplicates)
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
      
      // Should be sorted
      const sortedCategories = [...categories].sort();
      expect(categories).toEqual(sortedCategories);
    });
  });
});
