'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Inventory,
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  RestoreFromTrash,
  AddBox,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { sweetsApi, inventoryApi } from '@/utils/api';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Sweet {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface SweetForm {
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  image_url: string;
}

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [sweetDialog, setSweetDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    sweet: Sweet | null;
  }>({
    open: false,
    mode: 'create',
    sweet: null,
  });
  const [restockDialog, setRestockDialog] = useState<{
    open: boolean;
    sweet: Sweet | null;
    quantity: number;
  }>({
    open: false,
    sweet: null,
    quantity: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SweetForm>();


  const { data: sweetsData, isLoading: sweetsLoading } = useQuery(
    'sweets',
    sweetsApi.getAll,
    { enabled: isAuthenticated && isAdmin }
  );

  const { data: statsData, isLoading: statsLoading } = useQuery(
    'inventoryStats',
    inventoryApi.getStats,
    { enabled: isAuthenticated && isAdmin }
  );


  const createSweetMutation = useMutation(sweetsApi.create, {
    onSuccess: () => {
      toast.success('Sweet created successfully');
      queryClient.invalidateQueries('sweets');
      queryClient.invalidateQueries('inventoryStats');
      setSweetDialog({ open: false, mode: 'create', sweet: null });
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create sweet');
    },
  });

  const updateSweetMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<SweetForm> }) =>
      sweetsApi.update(id, data),
    {
      onSuccess: () => {
        toast.success('Sweet updated successfully');
        queryClient.invalidateQueries('sweets');
        queryClient.invalidateQueries('inventoryStats');
        setSweetDialog({ open: false, mode: 'create', sweet: null });
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update sweet');
      },
    }
  );

  const deleteSweetMutation = useMutation(sweetsApi.delete, {
    onSuccess: () => {
      toast.success('Sweet deleted successfully');
      queryClient.invalidateQueries('sweets');
      queryClient.invalidateQueries('inventoryStats');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete sweet');
    },
  });

  const restockMutation = useMutation(
    ({ sweetId, quantity }: { sweetId: number; quantity: number }) =>
      sweetsApi.restock(sweetId, quantity),
    {
      onSuccess: (data) => {
        toast.success(data.data.message);
        queryClient.invalidateQueries('sweets');
        queryClient.invalidateQueries('inventoryStats');
        setRestockDialog({ open: false, sweet: null, quantity: 0 });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Restock failed');
      },
    }
  );

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Admin access required
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You need administrator privileges to access this page.
        </Typography>
      </Container>
    );
  }

  const sweets = sweetsData?.data?.sweets || [];
  const stats = statsData?.data?.stats || {};

  const handleCreateSweet = () => {
    setSweetDialog({ open: true, mode: 'create', sweet: null });
    reset();
  };

  const handleEditSweet = (sweet: Sweet) => {
    setSweetDialog({ open: true, mode: 'edit', sweet });
    reset({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
      description: sweet.description,
      image_url: sweet.image_url,
    });
  };

  const handleDeleteSweet = (sweet: Sweet) => {
    if (window.confirm(`Are you sure you want to delete "${sweet.name}"?`)) {
      deleteSweetMutation.mutate(sweet.id);
    }
  };

  const handleRestock = (sweet: Sweet) => {
    setRestockDialog({ open: true, sweet, quantity: 0 });
  };

  const onSubmit = (data: SweetForm) => {
    if (sweetDialog.mode === 'create') {
      createSweetMutation.mutate(data);
    } else if (sweetDialog.sweet) {
      updateSweetMutation.mutate({ id: sweetDialog.sweet.id, data });
    }
  };

  const confirmRestock = () => {
    if (restockDialog.sweet && restockDialog.quantity > 0) {
      restockMutation.mutate({
        sweetId: restockDialog.sweet.id,
        quantity: restockDialog.quantity,
      });
    }
  };

  if (sweetsLoading || statsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading admin dashboard...
        </Typography>
      </Container>
    );
  }

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
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your sweet shop inventory and analytics
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Inventory sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {stats.totalSweets || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Sweets
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    ${(stats.totalValue || 0).toFixed(0)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Inventory Value
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {stats.lowStock || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Low Stock
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <RestoreFromTrash sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {stats.outOfStock || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Out of Stock
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">
                  Inventory Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateSweet}
                  sx={{
                    background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #654321, #A0522D)',
                    },
                  }}
                >
                  Add Sweet
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sweets.map((sweet: Sweet) => (
                      <TableRow key={sweet.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {sweet.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sweet.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          ${sweet.price.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            color={sweet.quantity === 0 ? 'error.main' :
                              sweet.quantity <= 10 ? 'warning.main' : 'success.main'}
                            fontWeight="bold"
                          >
                            {sweet.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              sweet.quantity === 0 ? 'Out of Stock' :
                                sweet.quantity <= 10 ? 'Low Stock' : 'In Stock'
                            }
                            size="small"
                            color={
                              sweet.quantity === 0 ? 'error' :
                                sweet.quantity <= 10 ? 'warning' : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditSweet(sweet)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRestock(sweet)}
                              color="success"
                            >
                              <AddBox />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSweet(sweet)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Sweet Dialog */}
      <Dialog
        open={sweetDialog.open}
        onClose={() => setSweetDialog({ open: false, mode: 'create', sweet: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {sweetDialog.mode === 'create' ? 'Add New Sweet' : 'Edit Sweet'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              {...register('name', { required: 'Name is required' })}
              fullWidth
              label="Sweet Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('category', { required: 'Category is required' })}
              fullWidth
              label="Category"
              error={!!errors.category}
              helperText={errors.category?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('price', {
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              fullWidth
              label="Price"
              type="number"
              inputProps={{ step: '0.01' }}
              error={!!errors.price}
              helperText={errors.price?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 0, message: 'Quantity must be non-negative' }
              })}
              fullWidth
              label="Quantity"
              type="number"
              error={!!errors.quantity}
              helperText={errors.quantity?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('description')}
              fullWidth
              label="Description"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              {...register('image_url')}
              fullWidth
              label="Image URL"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSweetDialog({ open: false, mode: 'create', sweet: null })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={createSweetMutation.isLoading || updateSweetMutation.isLoading}
          >
            {sweetDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog
        open={restockDialog.open}
        onClose={() => setRestockDialog({ open: false, sweet: null, quantity: 0 })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Restock {restockDialog.sweet?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Current Stock: {restockDialog.sweet?.quantity}
            </Typography>
            <TextField
              fullWidth
              label="Quantity to Add"
              type="number"
              value={restockDialog.quantity}
              onChange={(e) => setRestockDialog(prev => ({
                ...prev,
                quantity: Math.max(0, parseInt(e.target.value) || 0)
              }))}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              New total will be: {(restockDialog.sweet?.quantity || 0) + restockDialog.quantity}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRestockDialog({ open: false, sweet: null, quantity: 0 })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmRestock}
            disabled={restockMutation.isLoading || restockDialog.quantity <= 0}
          >
            {restockMutation.isLoading ? 'Processing...' : 'Restock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;

