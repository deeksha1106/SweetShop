import { fetchSweets, purchaseSweet, loginUser, registerUser } from '../../src/utils/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('fetchSweets', () => {
    test('should fetch sweets successfully', async () => {
      const mockSweets = [
        {
          id: 1,
          name: 'Chocolate Truffle',
          category: 'Chocolate',
          price: 2.99,
          quantity: 50,
          description: 'Rich chocolate truffle',
          image_url: '/images/chocolate.jpg',
        },
      ];

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sweets: mockSweets },
        }),
      } as Response);

      const result = await fetchSweets();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/sweets', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockSweets);
    });

    test('should handle fetch error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(fetchSweets()).rejects.toThrow('Failed to fetch sweets');
    });

    test('should handle network error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fetchSweets()).rejects.toThrow('Network error');
    });
  });

  describe('purchaseSweet', () => {
    test('should purchase sweet successfully', async () => {
      const mockPurchase = {
        id: 1,
        quantity: 3,
        totalPrice: 8.97,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { purchase: mockPurchase },
        }),
      } as Response);

      const result = await purchaseSweet(1, 3);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/sweets/1/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null',
        },
        body: JSON.stringify({ quantity: 3 }),
      });
      expect(result).toEqual(mockPurchase);
    });

    test('should handle purchase error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Insufficient stock',
        }),
      } as Response);

      await expect(purchaseSweet(1, 100)).rejects.toThrow('Insufficient stock');
    });

    test('should include authorization token when available', async () => {
      // Mock localStorage
      const mockToken = 'mock-jwt-token';
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => mockToken),
        },
        writable: true,
      });

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { purchase: { id: 1 } },
        }),
      } as Response);

      await purchaseSweet(1, 1);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });
  });

  describe('loginUser', () => {
    test('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };
      const mockToken = 'mock-jwt-token';

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: mockUser, token: mockToken },
        }),
      } as Response);

      const result = await loginUser('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      expect(result).toEqual({ user: mockUser, token: mockToken });
    });

    test('should handle login error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      } as Response);

      await expect(loginUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('registerUser', () => {
    test('should register user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        role: 'user',
      };
      const mockToken = 'mock-jwt-token';

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: mockUser, token: mockToken },
        }),
      } as Response);

      const result = await registerUser('newuser@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
        }),
      });
      expect(result).toEqual({ user: mockUser, token: mockToken });
    });

    test('should handle registration error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Email already exists',
        }),
      } as Response);

      await expect(registerUser('existing@example.com', 'password123')).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON response', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(fetchSweets()).rejects.toThrow('Invalid JSON');
    });

    test('should handle missing data in response', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          // Missing data field
        }),
      } as Response);

      await expect(fetchSweets()).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(fetchSweets()).rejects.toThrow('Request timeout');
    });
  });

  describe('Request Configuration', () => {
    test('should use correct base URL from environment', async () => {
      // Mock environment variable
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.sweetshop.com';

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sweets: [] },
        }),
      } as Response);

      await fetchSweets();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.sweetshop.com'),
        expect.any(Object)
      );

      // Restore original environment
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    test('should include proper headers for all requests', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sweets: [] },
        }),
      } as Response);

      await fetchSweets();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Response Validation', () => {
    test('should validate response structure', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing success field
          data: { sweets: [] },
        }),
      } as Response);

      await expect(fetchSweets()).rejects.toThrow();
    });

    test('should handle empty response data', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sweets: [] },
        }),
      } as Response);

      const result = await fetchSweets();
      expect(result).toEqual([]);
    });

    test('should validate sweet object structure', async () => {
      const invalidSweet = {
        id: 1,
        name: 'Test Sweet',
        // Missing required fields
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sweets: [invalidSweet] },
        }),
      } as Response);

      const result = await fetchSweets();
      expect(result).toEqual([invalidSweet]); // API should handle validation
    });
  });
});
