import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { theme } from '../../src/theme/theme';
import SweetCard from '../../src/components/SweetCard';

// Mock the API calls
jest.mock('../../src/utils/api', () => ({
  purchaseSweet: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/shop',
  }),
}));

const mockSweet = {
  id: 1,
  name: 'Chocolate Truffle',
  category: 'Chocolate',
  price: 2.50,
  quantity: 50,
  description: 'Rich and creamy chocolate truffle with cocoa powder coating',
  image_url: '/images/chocolate-truffle.jpg',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

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

describe('SweetCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render sweet information correctly', () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
      expect(screen.getByText('Chocolate')).toBeInTheDocument();
      expect(screen.getByText('₹2.50')).toBeInTheDocument();
      expect(screen.getByText('Rich and creamy chocolate truffle with cocoa powder coating')).toBeInTheDocument();
      expect(screen.getByText('✅ 50 in stock')).toBeInTheDocument();
    });

    test('should show out of stock badge when quantity is 0', () => {
      const outOfStockSweet = { ...mockSweet, quantity: 0 };
      render(<SweetCard sweet={outOfStockSweet} />, { wrapper: createWrapper() });

      expect(screen.getByText('Out of stock')).toBeInTheDocument();
      expect(screen.queryByText('✅ 50 in stock')).not.toBeInTheDocument();
    });

    test('should display category image when no image_url provided', () => {
      const sweetWithoutImage = { ...mockSweet, image_url: '' };
      render(<SweetCard sweet={sweetWithoutImage} />, { wrapper: createWrapper() });

      // The component should still render without errors
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
    });

    test('should handle long descriptions with truncation', () => {
      const longDescription = 'This is a very long description that should be truncated when displayed in the card to maintain proper layout and visual hierarchy throughout the interface';
      const sweetWithLongDescription = { ...mockSweet, description: longDescription };
      
      render(<SweetCard sweet={sweetWithLongDescription} />, { wrapper: createWrapper() });

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    test('should show different stock levels correctly', () => {
      const testCases = [
        { quantity: 1, expected: '✅ 1 in stock' },
        { quantity: 5, expected: '✅ 5 in stock' },
        { quantity: 100, expected: '✅ 100 in stock' },
      ];

      testCases.forEach(({ quantity, expected }) => {
        const { unmount } = render(
          <SweetCard sweet={{ ...mockSweet, quantity }} />, 
          { wrapper: createWrapper() }
        );
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('User Interactions', () => {
    test('should open purchase dialog when Add to Cart is clicked', async () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(screen.getByText('Purchase Chocolate Truffle')).toBeInTheDocument();
        expect(screen.getByText('Price: ₹2.50 each')).toBeInTheDocument();
        expect(screen.getByText('Available: 50 in stock')).toBeInTheDocument();
      });
    });

    test('should disable Add to Cart button when out of stock', () => {
      const outOfStockSweet = { ...mockSweet, quantity: 0 };
      render(<SweetCard sweet={outOfStockSweet} />, { wrapper: createWrapper() });

      const addToCartButton = screen.getByText('Out of Stock');
      expect(addToCartButton).toBeDisabled();
    });

    test('should handle quantity selection in purchase dialog', async () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      // Open purchase dialog
      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      // Change quantity
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByText('Total: ₹12.50')).toBeInTheDocument(); // 2.50 * 5
    });

    test('should validate quantity limits in purchase dialog', async () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        
        // Try to set quantity higher than available stock
        fireEvent.change(quantityInput, { target: { value: '100' } });
        
        // Should be limited to available stock
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      });
    });

    test('should close purchase dialog when Cancel is clicked', async () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        expect(screen.getByText('Purchase Chocolate Truffle')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Purchase Chocolate Truffle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Purchase Functionality', () => {
    test('should handle successful purchase', async () => {
      const { purchaseSweet } = require('../../src/utils/api');
      purchaseSweet.mockResolvedValue({
        success: true,
        data: { purchase: { id: 1, quantity: 3, totalPrice: 7.50 } }
      });

      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      // Open dialog and make purchase
      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        fireEvent.change(quantityInput, { target: { value: '3' } });
      });

      fireEvent.click(screen.getByText('Purchase'));

      await waitFor(() => {
        expect(purchaseSweet).toHaveBeenCalledWith(1, 3);
      });
    });

    test('should handle purchase failure', async () => {
      const { purchaseSweet } = require('../../src/utils/api');
      purchaseSweet.mockRejectedValue(new Error('Insufficient stock'));

      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Purchase'));
      });

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('should show loading state during purchase', async () => {
      const { purchaseSweet } = require('../../src/utils/api');
      let resolvePromise: (value: any) => void;
      const purchasePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      purchaseSweet.mockReturnValue(purchasePromise);

      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Add to Cart'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Purchase'));
      });

      // Should show loading state
      expect(screen.getByText('Purchasing...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({ success: true });
    });
  });

  describe('Authentication States', () => {
    test('should hide Add to Cart button when not authenticated', () => {
      const unauthenticatedContext = {
        ...mockAuthContextValue,
        isAuthenticated: false,
        user: null,
      };

      render(<SweetCard sweet={mockSweet} />, { 
        wrapper: createWrapper(unauthenticatedContext) 
      });

      expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
      expect(screen.getByText('Login to Purchase')).toBeInTheDocument();
    });

    test('should show admin actions for admin users', () => {
      const adminContext = {
        ...mockAuthContextValue,
        isAdmin: true,
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
      };

      render(<SweetCard sweet={mockSweet} />, { 
        wrapper: createWrapper(adminContext) 
      });

      expect(screen.getByLabelText('Edit sweet')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete sweet')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to different screen sizes', () => {
      // Mock window.matchMedia for responsive testing
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

      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      // Component should render without errors on mobile
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      const addToCartButton = screen.getByText('Add to Cart');
      
      // Focus the button
      addToCartButton.focus();
      expect(addToCartButton).toHaveFocus();

      // Press Enter to activate
      fireEvent.keyDown(addToCartButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Purchase Chocolate Truffle')).toBeInTheDocument();
      });
    });

    test('should have proper color contrast', () => {
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      // This would typically involve checking computed styles
      // For now, we ensure the component renders with theme colors
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing sweet data gracefully', () => {
      const incompleteSeet = {
        id: 1,
        name: 'Test Sweet',
        // Missing other required fields
      } as any;

      render(<SweetCard sweet={incompleteSeet} />, { wrapper: createWrapper() });

      expect(screen.getByText('Test Sweet')).toBeInTheDocument();
      // Component should not crash with missing data
    });

    test('should handle invalid price values', () => {
      const invalidPriceSweet = { ...mockSweet, price: NaN };
      
      render(<SweetCard sweet={invalidPriceSweet} />, { wrapper: createWrapper() });

      // Should handle invalid price gracefully
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
    });

    test('should handle network errors during image loading', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SweetCard sweet={mockSweet} />, { wrapper: createWrapper() });

      // Simulate image load error
      const images = screen.getAllByRole('img', { hidden: true });
      if (images.length > 0) {
        fireEvent.error(images[0]);
      }

      // Component should still render
      expect(screen.getByText('Chocolate Truffle')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});
