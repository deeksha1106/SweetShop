import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Info,
  Add,
  Remove,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { purchaseSweet } from '../utils/api';
import { Sweet } from '../types';

interface SweetCardProps {
  sweet: Sweet;
  onPurchase?: (sweetId: number, quantity: number) => void;
  onFavorite?: (sweetId: number) => void;
  isFavorite?: boolean;
}

const SweetCard: React.FC<SweetCardProps> = ({
  sweet,
  onPurchase,
  onFavorite,
  isFavorite = false,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  if (!sweet) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Typography color="error">Invalid sweet data</Typography>
        </CardContent>
      </Card>
    );
  }

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      setError('Please log in to make a purchase');
      return;
    }
    setPurchaseDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handlePurchaseConfirm = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to make a purchase');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await purchaseSweet(sweet.id, quantity);
      setSuccess(`Successfully purchased ${quantity} ${sweet.name}(s)!`);
      setPurchaseDialogOpen(false);
      setQuantity(1);
      
      if (onPurchase) {
        onPurchase(sweet.id, quantity);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      setError('Please log in to add favorites');
      return;
    }
    
    if (onFavorite) {
      onFavorite(sweet.id);
    }
  };

  const incrementQuantity = () => {
    if (quantity < sweet.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const getStockStatus = () => {
    if (sweet.quantity === 0) {
      return { label: 'Out of Stock', color: 'error' as const };
    } else if (sweet.quantity <= 10) {
      return { label: 'Low Stock', color: 'warning' as const };
    } else {
      return { label: 'In Stock', color: 'success' as const };
    }
  };

  const stockStatus = getStockStatus();

  const getFallbackImage = (category: string) => {
    const categoryImages: { [key: string]: string } = {
      chocolate: '/images/fallback/chocolate.jpg',
      candy: '/images/fallback/candy.jpg',
      gummy: '/images/fallback/gummy.jpg',
      lollipop: '/images/fallback/lollipop.jpg',
      caramel: '/images/fallback/caramel.jpg',
      truffle: '/images/fallback/truffle.jpg',
      fudge: '/images/fallback/fudge.jpg',
      toffee: '/images/fallback/toffee.jpg',
      marshmallow: '/images/fallback/marshmallow.jpg',
    };
    
    if (!category) {
      return '/images/fallback/sweet.jpg';
    }
    
    return categoryImages[category.toLowerCase()] || '/images/fallback/sweet.jpg';
  };

  const imageUrl = sweet.image_url || getFallbackImage(sweet.category);

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 69, 19, 0.2)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(139, 69, 19, 0.3)',
          },
        }}
      >
        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
          data-testid="favorite-button"
        >
          {isFavorite ? (
            <Favorite sx={{ color: '#D2691E' }} />
          ) : (
            <FavoriteBorder sx={{ color: '#8B4513' }} />
          )}
        </IconButton>

        {/* Stock Status Chip */}
        <Chip
          label={stockStatus.label}
          color={stockStatus.color}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            fontWeight: 'bold',
          }}
        />

        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={sweet.name}
          sx={{
            objectFit: 'cover',
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getFallbackImage(sweet.category);
          }}
        />

        <CardContent sx={{ flexGrow: 1, color: 'white' }}>
          <Typography
            gutterBottom
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: '#F5DEB3',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {sweet.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(245, 222, 179, 0.8)',
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {sweet.description}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip
              label={sweet.category}
              size="small"
              sx={{
                backgroundColor: 'rgba(245, 222, 179, 0.2)',
                color: '#F5DEB3',
                border: '1px solid rgba(245, 222, 179, 0.3)',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              ₹{sweet.price.toFixed(2)}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: 'rgba(245, 222, 179, 0.7)',
              display: 'block',
              mb: 2,
            }}
          >
            Available: {sweet.quantity} units
          </Typography>
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCart />}
            onClick={handlePurchaseClick}
            disabled={sweet.quantity === 0 || loading}
            sx={{
              background: sweet.quantity === 0 
                ? 'rgba(139, 69, 19, 0.3)' 
                : 'linear-gradient(45deg, #D2691E 30%, #FF8C00 90%)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: sweet.quantity === 0 
                  ? 'rgba(139, 69, 19, 0.3)' 
                  : 'linear-gradient(45deg, #FF8C00 30%, #D2691E 90%)',
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
            data-testid="purchase-button"
          >
            {sweet.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </Box>
      </Card>

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="purchase-dialog"
      >
        <DialogTitle>
          Purchase {sweet.name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Typography variant="body1">Quantity:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                size="small"
                data-testid="decrease-quantity"
              >
                <Remove />
              </IconButton>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= sweet.quantity) {
                    setQuantity(value);
                  }
                }}
                inputProps={{
                  min: 1,
                  max: sweet.quantity,
                  'data-testid': 'quantity-input',
                }}
                sx={{ width: '80px' }}
                size="small"
              />
              <IconButton
                onClick={incrementQuantity}
                disabled={quantity >= sweet.quantity}
                size="small"
                data-testid="increase-quantity"
              >
                <Add />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Total: ₹{(sweet.price * quantity).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPurchaseDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchaseConfirm}
            variant="contained"
            disabled={loading}
            data-testid="confirm-purchase"
          >
            {loading ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}
        >
          {success}
        </Alert>
      )}
      {error && !purchaseDialogOpen && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}
        >
          {error}
        </Alert>
      )}
    </>
  );
};

export default SweetCard;
