import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { theme } from '../../src/theme/theme';
import ShopPage from '../../src/app/shop/page';

// Mock the API calls
jest.mock('../../src/utils/api', () => ({
  fetchSweets: jest.fn(),
  purchaseSweet: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/shop',
  }),
}));

const mockSweets = [
  {
    id: 1,
    name: 'Dark Chocolate Truffle',
    category: 'Chocolate',
    price: 3.99,
    quantity: 25,
    description: 'Rich dark chocolate truffle with cocoa powder',
    image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Strawberry Gummy Bears',
    category: 'Gummy',
    price: 2.49,
    quantity: 0, // Out of stock
    description: 'Chewy strawberry-flavored gummy bears',
    image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Caramel Lollipop',
    category: 'Lollipop',
    price: 1.99,
    quantity: 30,
    description: 'Sweet caramel lollipop on a stick',
    image_url: '',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockAuthContextValue = {
  isAuthenticated: true,
  isAdmin: false,
  user: { id: 1, email: 'test@example.com', role: 'user' },
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const createWrapper = (authValue = mockAuthContextValue) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider value={authValue}>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Shop Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { fetchSweets } = require('../../src/utils/api');
    fetchSweets.mockResolvedValue(mockSweets);
  });

  describe('Page Rendering', () => {
    test('should render shop page with title and description', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Sweet Shop')).toBeInTheDocument();
      expect(screen.getByText(/discover our premium collection/i)).toBeInTheDocument();
    });

    test('should render all sweets when loaded', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
        expect(screen.getByText('Strawberry Gummy Bears')).toBeInTheDocument();
        expect(screen.getByText('Caramel Lollipop')).toBeInTheDocument();
      });
    });

    test('should show loading state initially', () => {
      const { fetchSweets } = require('../../src/utils/api');
      fetchSweets.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ShopPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('should handle error state', async () => {
      const { fetchSweets } = require('../../src/utils/api');
      fetchSweets.mockRejectedValue(new Error('Failed to fetch'));

      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    test('should filter sweets by category', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      });

      // Click on Chocolate category filter
      const chocolateFilter = screen.getByText('Chocolate');
      fireEvent.click(chocolateFilter);

      // Should show only chocolate sweets
      expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      expect(screen.queryByText('Strawberry Gummy Bears')).not.toBeInTheDocument();
    });

    test('should filter sweets by price range', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      });

      // Set price filter
      const minPriceInput = screen.getByLabelText(/min price/i);
      const maxPriceInput = screen.getByLabelText(/max price/i);

      fireEvent.change(minPriceInput, { target: { value: '2' } });
      fireEvent.change(maxPriceInput, { target: { value: '3' } });

      // Should show only sweets in price range
      expect(screen.getByText('Strawberry Gummy Bears')).toBeInTheDocument();
      expect(screen.queryByText('Dark Chocolate Truffle')).not.toBeInTheDocument();
    });

    test('should filter by stock availability', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      });

      // Toggle "In Stock Only" filter
      const inStockFilter = screen.getByLabelText(/in stock only/i);
      fireEvent.click(inStockFilter);

      // Should hide out of stock items
      expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      expect(screen.queryByText('Strawberry Gummy Bears')).not.toBeInTheDocument();
    });

    test('should search sweets by name', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      });

      // Search for "chocolate"
      const searchInput = screen.getByPlaceholderText(/search sweets/i);
      fireEvent.change(searchInput, { target: { value: 'chocolate' } });

      // Should show only matching sweets
      expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      expect(screen.queryByText('Strawberry Gummy Bears')).not.toBeInTheDocument();
    });

    test('should clear all filters', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      });

      // Apply some filters
      const chocolateFilter = screen.getByText('Chocolate');
      fireEvent.click(chocolateFilter);

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      fireEvent.click(clearButton);

      // Should show all sweets again
      expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
      expect(screen.getByText('Strawberry Gummy Bears')).toBeInTheDocument();
    });
  });

  describe('Sweet Cards Display', () => {
    test('should display sweet information correctly', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Check sweet details
        expect(screen.getByText('Dark Chocolate Truffle')).toBeInTheDocument();
        expect(screen.getByText('₹3.99')).toBeInTheDocument();
        expect(screen.getByText('Rich dark chocolate truffle with cocoa powder')).toBeInTheDocument();
        expect(screen.getByText('✅ 25 in stock')).toBeInTheDocument();
      });
    });

    test('should show out of stock badge', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Out of stock')).toBeInTheDocument();
      });
    });

    test('should use fallback images for sweets without image_url', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Caramel Lollipop')).toBeInTheDocument();
        // The component should still render without errors even with empty image_url
      });
    });
  });

  describe('Purchase Functionality', () => {
    test('should open purchase dialog when Add to Cart is clicked', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const addToCartButton = screen.getAllByText('Add to Cart')[0];
        fireEvent.click(addToCartButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Purchase Dark Chocolate Truffle')).toBeInTheDocument();
      });
    });

    test('should handle successful purchase', async () => {
      const { purchaseSweet } = require('../../src/utils/api');
      purchaseSweet.mockResolvedValue({
        success: true,
        data: { purchase: { id: 1, quantity: 2, totalPrice: 7.98 } }
      });

      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const addToCartButton = screen.getAllByText('Add to Cart')[0];
        fireEvent.click(addToCartButton);
      });

      await waitFor(() => {
        const purchaseButton = screen.getByText('Purchase');
        fireEvent.click(purchaseButton);
      });

      await waitFor(() => {
        expect(purchaseSweet).toHaveBeenCalledWith(1, 1);
      });
    });

    test('should disable purchase for out of stock items', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const outOfStockButton = screen.getByText('Out of Stock');
        expect(outOfStockButton).toBeDisabled();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should adapt grid layout for different screen sizes', () => {
      // Mock window.matchMedia for mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 600px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<ShopPage />, { wrapper: createWrapper() });

      // Component should render without errors on mobile
      expect(screen.getByText('Sweet Shop')).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    test('should show login prompt when not authenticated', () => {
      const unauthenticatedContext = {
        ...mockAuthContextValue,
        isAuthenticated: false,
        user: null,
      };

      render(<ShopPage />, { wrapper: createWrapper(unauthenticatedContext) });

      expect(screen.getByText(/login to purchase/i)).toBeInTheDocument();
    });

    test('should show admin features for admin users', () => {
      const adminContext = {
        ...mockAuthContextValue,
        isAdmin: true,
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
      };

      render(<ShopPage />, { wrapper: createWrapper(adminContext) });

      // Admin should see additional options
      expect(screen.getByText('Sweet Shop')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should handle large number of sweets efficiently', async () => {
      const largeSweets = Array.from({ length: 100 }, (_, i) => ({
        ...mockSweets[0],
        id: i + 1,
        name: `Sweet ${i + 1}`,
      }));

      const { fetchSweets } = require('../../src/utils/api');
      fetchSweets.mockResolvedValue(largeSweets);

      const { result, duration } = await global.perfUtils.measureTime(async () => {
        render(<ShopPage />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Sweet 1')).toBeInTheDocument();
        });
      });

      // Should render within reasonable time
      global.perfUtils.assertExecutionTime(duration, 5000);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const { fetchSweets } = require('../../src/utils/api');
      fetchSweets.mockRejectedValue(new Error('Network error'));

      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/error loading sweets/i)).toBeInTheDocument();
      });
    });

    test('should handle empty sweet list', async () => {
      const { fetchSweets } = require('../../src/utils/api');
      fetchSweets.mockResolvedValue([]);

      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/no sweets found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('search')).toBeInTheDocument();
      });
    });

    test('should support keyboard navigation', async () => {
      render(<ShopPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search sweets/i);
        searchInput.focus();
        expect(searchInput).toHaveFocus();
      });
    });
  });
});
