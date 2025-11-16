'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryApi } from '@/utils/api';
import { useQuery } from 'react-query';
import { History, ShoppingCart, AttachMoney, CalendarToday } from '@mui/icons-material';

interface Purchase {
  id: number;
  sweet_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  created_at: string;
}

const PurchaseHistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: purchasesData,
    isLoading,
    error,
  } = useQuery('purchaseHistory', inventoryApi.getPurchaseHistory, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Please sign in to view your purchase history
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your purchase history...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Failed to load purchase history. Please try again later.
        </Alert>
      </Container>
    );
  }

  const purchases: Purchase[] = purchasesData?.data?.purchases || [];
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.total_price, 0);
  const totalItems = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Purchase History
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track all your sweet purchases and spending
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ShoppingCart sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {purchases.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Orders
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <History sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {totalItems}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Items Purchased
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    ${totalSpent.toFixed(2)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Spent
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Purchase Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Purchase Details
              </Typography>

              {purchases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No purchases yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Start shopping to see your purchase history here
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sweet</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="center">Unit Price</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchases.map((purchase, index) => (
                        <TableRow
                          key={purchase.id}
                          component={motion.tr}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography variant="body1" fontWeight="medium">
                              {purchase.sweet_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={purchase.quantity}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              ${purchase.unit_price.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              ${purchase.total_price.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {new Date(purchase.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default PurchaseHistoryPage;