const Sweet = require('../../models/Sweet');
const { database } = require('../setup');

describe('Sweet Model - Core Features', () => {
  describe('Create Sweet', () => {
    it('should create a new sweet with valid data', async () => {
      const sweetData = testUtils.createTestSweet();
      
      const sweet = await Sweet.create(sweetData);
      
      expect(sweet).toBeDefined();
      expect(sweet.id).toBeDefined();
      expect(sweet.name).toBe(sweetData.name);
      expect(sweet.category).toBe(sweetData.category);
      expect(sweet.price).toBe(sweetData.price);
      expect(sweet.quantity).toBe(sweetData.quantity);
    });

    it('should fail to create sweet with missing required fields', async () => {
      const invalidData = { name: 'Test Sweet' }; // Missing required fields
      
      await expect(Sweet.create(invalidData)).rejects.toThrow();
    });

    it('should fail to create sweet with invalid price', async () => {
      const sweetData = testUtils.createTestSweet();
      sweetData.price = -5; // Invalid negative price
      
      await expect(Sweet.create(sweetData)).rejects.toThrow();
    });
  });

  describe('Find Sweet', () => {
    let testSweet;

    beforeEach(async () => {
      const sweetData = testUtils.createTestSweet();
      testSweet = await Sweet.create(sweetData);
    });

    it('should find sweet by id', async () => {
      const found = await Sweet.findById(testSweet.id);
      
      expect(found).toBeDefined();
      expect(found.id).toBe(testSweet.id);
      expect(found.name).toBe(testSweet.name);
    });

    it('should return null for non-existent sweet', async () => {
      const found = await Sweet.findById(99999);
      
      expect(found).toBeNull();
    });

    it('should find all sweets', async () => {
      const sweets = await Sweet.findAll();
      
      expect(Array.isArray(sweets)).toBe(true);
      expect(sweets.length).toBeGreaterThan(0);
      expect(sweets.some(s => s.id === testSweet.id)).toBe(true);
    });
  });

  describe('Update Sweet', () => {
    let testSweet;

    beforeEach(async () => {
      const sweetData = testUtils.createTestSweet();
      testSweet = await Sweet.create(sweetData);
    });

    it('should update sweet price', async () => {
      const newPrice = 5.99;
      
      const updated = await Sweet.update(testSweet.id, { price: newPrice });
      
      expect(updated).toBeDefined();
      expect(updated.price).toBe(newPrice);
      expect(updated.id).toBe(testSweet.id);
    });

    it('should update sweet quantity', async () => {
      const newQuantity = 50;
      
      const updated = await Sweet.update(testSweet.id, { quantity: newQuantity });
      
      expect(updated.quantity).toBe(newQuantity);
    });

    it('should fail to update with invalid data', async () => {
      await expect(Sweet.update(testSweet.id, { price: -10 })).rejects.toThrow();
    });
  });

  describe('Delete Sweet', () => {
    let testSweet;

    beforeEach(async () => {
      const sweetData = testUtils.createTestSweet();
      testSweet = await Sweet.create(sweetData);
    });

    it('should delete sweet by id', async () => {
      const result = await Sweet.delete(testSweet.id);
      
      expect(result).toBe(true);
      
      // Verify sweet is deleted
      const found = await Sweet.findById(testSweet.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent sweet', async () => {
      const result = await Sweet.delete(99999);
      
      expect(result).toBe(false);
    });
  });

  describe('Purchase Sweet', () => {
    let testSweet;

    beforeEach(async () => {
      const sweetData = testUtils.createTestSweet();
      sweetData.quantity = 100; // Ensure enough stock
      testSweet = await Sweet.create(sweetData);
    });

    it('should purchase sweet and reduce quantity', async () => {
      const purchaseQuantity = 5;
      const initialQuantity = testSweet.quantity;
      
      const result = await Sweet.purchase(testSweet.id, purchaseQuantity);
      
      expect(result).toBe(true);
      
      // Verify quantity reduced
      const updated = await Sweet.findById(testSweet.id);
      expect(updated.quantity).toBe(initialQuantity - purchaseQuantity);
    });

    it('should fail to purchase more than available quantity', async () => {
      const purchaseQuantity = testSweet.quantity + 10;
      
      await expect(Sweet.purchase(testSweet.id, purchaseQuantity)).rejects.toThrow();
    });

    it('should fail to purchase zero or negative quantity', async () => {
      await expect(Sweet.purchase(testSweet.id, 0)).rejects.toThrow();
      await expect(Sweet.purchase(testSweet.id, -5)).rejects.toThrow();
    });
  });
});
