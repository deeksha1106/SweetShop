"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  ShoppingCart,
  FilterList,
  Add,
  Remove,
  AttachMoney,
  Category,
  Inventory,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { sweetsApi } from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";

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

const CATEGORY_IMAGES: Record<string, string[]> = {
  chocolate: [
    "https://images.unsplash.com/photo-1687795097254-f019f9d7fd17?q=80&w=1470&auto=format&fit=crop",
    "https://plus.unsplash.com/premium_photo-1667031519192-ba1ed681751d?q=80&w=1471&auto=format&fit=crop",
  ],
  gummy: [
    "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=1470&auto=format&fit=crop",
  ],
  fudge: [
    "https://images.unsplash.com/photo-1598305764173-6ac4d74dbc5c?q=80&w=1470&auto=format&fit=crop",
  ],
  lollipop: [
    "https://images.unsplash.com/photo-1703319953569-72084ac406b6?q=80&w=1074&auto=format&fit=crop",
  ],
  caramel: [
    "https://images.unsplash.com/photo-1574201742421-fffd6af7a680?q=80&w=1470&auto=format&fit=crop",
  ],
  sour: [
    "https://images.unsplash.com/photo-1516747773440-e114ee0d3c07?q=80&w=1470&auto=format&fit=crop",
  ],
  candy: [
    "https://images.unsplash.com/photo-1576712967455-c8d22580e9be?q=80&w=1470&auto=format&fit=crop",
  ],
};
const CATEGORY_ALIASES: Record<string, string> = {
  chocolates: "chocolate",
  "chocolate bar": "chocolate",
  choco: "chocolate",
  candies: "candy",
  gummies: "gummy",
  "gummy bears": "gummy",
  lollipops: "lollipop",
  lolly: "lollipop",
  caramels: "caramel",
  "indian sweets": "indian",
  "traditional indian": "indian",
};

const normalize = (str: string = "") =>
  str.trim().toLowerCase().replace(/\s+/g, " "); 


const ShopPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [purchaseDialog, setPurchaseDialog] = useState<{
    open: boolean;
    sweet: Sweet | null;
    quantity: number;
  }>({
    open: false,
    sweet: null,
    quantity: 1,
  });
  const [sweetImage, setSweetImage] = useState<string>("");


  const {
    data: sweetsData,
    isLoading: sweetsLoading,
    error: sweetsError,
  } = useQuery("sweets", sweetsApi.getAll, {
    enabled: isAuthenticated,
  });

  const { data: categoriesData } = useQuery(
    "categories",
    sweetsApi.getCategories,
    {
      enabled: isAuthenticated,
    }
  );
  const getFinalSweetImage = (sweet: Sweet) => {
    const validCustom = sweet.image_url && sweet.image_url.trim().length > 0;
    if (validCustom) return sweet.image_url;
  
    const raw = normalize(sweet.category);
    const key = CATEGORY_ALIASES[raw] || raw;
  
    let matched = Object.keys(CATEGORY_IMAGES).find((k) => k === key);
    if (!matched) {
      matched = Object.keys(CATEGORY_IMAGES).find(
        (k) => key.includes(k) || k.includes(key)
      );
    }
  
    if (matched) {
      const imgs = CATEGORY_IMAGES[matched];
      return imgs[Math.abs(sweet.id) % imgs.length];
    }
  
    return "https://images.unsplash.com/photo-1565889673146-8e4d54300269?q=80&w=1470&auto=format&fit=crop";
  };

  const purchaseMutation = useMutation(
    ({ sweetId, quantity }: { sweetId: number; quantity: number }) =>
      sweetsApi.purchase(sweetId, quantity),
    {
      onSuccess: (data) => {
        toast.success(data.data.message);
        queryClient.invalidateQueries("sweets");
        setPurchaseDialog({ open: false, sweet: null, quantity: 1 });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Purchase failed");
      },
    }
  );

  const sweets = sweetsData?.data?.sweets || [];
  const categories = categoriesData?.data?.categories || [];

  const filteredSweets = sweets.filter((sweet: Sweet) => {
    const matchesSearch =
      sweet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sweet.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || sweet.category === selectedCategory;
    const matchesPriceMin =
      !priceRange.min || sweet.price >= parseFloat(priceRange.min);
    const matchesPriceMax =
      !priceRange.max || sweet.price <= parseFloat(priceRange.max);

    return (
      matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax
    );
  });
  console.log({abcd:filteredSweets});

  const handlePurchase = (sweet: Sweet) => {
    setPurchaseDialog({ open: true, sweet, quantity: 1 });
  };

  

  const confirmPurchase = () => {
    if (purchaseDialog.sweet) {
      purchaseMutation.mutate({
        sweetId: purchaseDialog.sweet.id,
        quantity: purchaseDialog.quantity,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Please sign in to access the shop
        </Typography>
        <Button variant="contained" href="/auth/login">
          Sign In
        </Button>
      </Container>
    );
  }

  if (sweetsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading sweet treats...
        </Typography>
      </Container>
    );
  }

  if (sweetsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Failed to load sweets. Please try again later.
        </Alert>
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
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              height: { xs: 200, md: 300 },
              mb: 3,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
              backgroundImage: `linear-gradient(rgba(18,12,10,0.45), rgba(18,12,10,0.45)), url('https://images.unsplash.com/photo-1682120501920-7ce18b00237a?q=80&w=1473&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid rgba(245,230,211,0.08)",
            }}
          />
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, #8B4513, #D2691E, #CD853F)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily:
                  '"Modern Aesthetic Serif Font", "Playfair Display", serif',
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                mb: 2,
              }}
            >
              Sweet Shop Collections
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 3,
                fontWeight: 300,
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                letterSpacing: "0.5px",
                maxWidth: 600,
                mx: "auto",
              }}
            >
              Discover our exquisite collection of artisanal sweets, crafted
              with passion and tradition
            </Typography>

            <Chip
              label="✨ Handcrafted Excellence ✨"
              sx={{
                background:
                  "linear-gradient(135deg, rgba(139, 69, 19, 0.2), rgba(210, 105, 30, 0.15))",
                color: "secondary.light",
                border: "1px solid rgba(139, 69, 19, 0.3)",
                fontSize: "0.9rem",
                fontWeight: 500,
                px: 2,
                py: 0.5,
                backdropFilter: "blur(8px)",
              }}
            />
          </Box>

          <Box
            sx={{
              background:
                "linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))",
              borderRadius: 3,
              p: 4,
              mb: 6,
              border: "1px solid rgba(139, 69, 19, 0.15)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "secondary.light",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FilterList /> Filter & Search
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search sweets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category: string) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Min Price"
                  type="number"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Max Price"
                  type="number"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setPriceRange({ min: "", max: "" });
                  }}
                  sx={{
                    height: "56px",
                    borderColor: "secondary.main",
                    color: "secondary.light",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "secondary.light",
                      backgroundColor: "rgba(139, 69, 19, 0.1)",
                    },
                  }}
                >
                  🗑️ Clear
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                background:
                  "linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.08))",
                borderRadius: 2,
                px: 3,
                py: 1.5,
                display: "inline-block",
                border: "1px solid rgba(139, 69, 19, 0.15)",
              }}
            >
              🎯 Showing {filteredSweets.length} of {sweets.length} premium
              sweets
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {filteredSweets.map((sweet: Sweet, index: number) => (

          <Grid item xs={12} sm={6} md={4} lg={3} key={sweet.id}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "visible",
                  background:
                    "linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))",
                  border: "1px solid rgba(139, 69, 19, 0.15)",
                  borderRadius: 3,
                  backdropFilter: "blur(16px)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 60px rgba(139, 69, 19, 0.25)",
                    border: "1px solid rgba(139, 69, 19, 0.3)",
                  },
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 1,
                  }}
                >
                  <Chip
                    size="small"
                    label={
                      sweet.quantity > 0
                        ? `✅ ${sweet.quantity} in stock`
                        : "Out of stock"
                    }
                    sx={{
                      background:
                        sweet.quantity > 0
                          ? "linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(56, 142, 60, 0.9))"
                          : "linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(211, 47, 47, 0.9))",
                      color: "white",
                      fontWeight: 600,
                      backdropFilter: "blur(8px)",
                    }}
                  />
                </Box>

                {sweet.category.toLowerCase().includes("indian") && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      label="🇮🇳 Indian"
                      sx={{
                        background:
                          "linear-gradient(90deg, #FF9933, #FFFFFF, #138808)",
                        color: "#2f1b14",
                        fontWeight: 700,
                        border: "1px solid rgba(47, 27, 20, 0.2)",
                      }}
                    />
                  </Box>
                )}

                <Box
                  sx={{
                    height: 200,
                    position: "relative",
                    borderBottom: "1px solid rgba(245,230,211,0.06)",
                    backgroundImage: `linear-gradient(rgba(18,12,10,0.15), rgba(18,12,10,0.25)), url(${getFinalSweetImage(sweet)}), url('/fallback.jpg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      label={sweet.category}
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(139, 69, 19, 0.15), rgba(210, 105, 30, 0.1))",
                        color: "secondary.light",
                        border: "1px solid rgba(139, 69, 19, 0.25)",
                        fontWeight: 500,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: "secondary.light",
                      fontSize: "1.25rem",
                      mb: 1.5,
                    }}
                  >
                    {sweet.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.6,
                      fontSize: "0.95rem",
                    }}
                  >
                    {sweet.description}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="span"
                      sx={{
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #8B4513, #D2691E, #CD853F)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: "1.5rem",
                      }}
                    >
                      ₹{sweet.price.toFixed(2)}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        background: "rgba(139, 69, 19, 0.1)",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      <Inventory
                        fontSize="small"
                        sx={{ color: "secondary.main" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "secondary.light",
                          fontWeight: 600,
                        }}
                      >
                        {sweet.quantity}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={() => handlePurchase(sweet)}
                    disabled={sweet.quantity === 0}
                    sx={{
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      background:
                        sweet.quantity > 0
                          ? "linear-gradient(135deg, #8B4513, #D2691E)"
                          : "linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(210, 105, 30, 0.2))",
                      boxShadow:
                        sweet.quantity > 0
                          ? "0 4px 16px rgba(139, 69, 19, 0.3)"
                          : "none",
                      "&:hover":
                        sweet.quantity > 0
                          ? {
                              background:
                                "linear-gradient(135deg, #654321, #A0522D)",
                              boxShadow: "0 6px 20px rgba(139, 69, 19, 0.4)",
                              transform: "translateY(-2px)",
                            }
                          : {},
                      "&:disabled": {
                        color: "rgba(245, 230, 211, 0.5)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {sweet.quantity > 0 ? (
                      " Add to Cart"
                    ) : (
                      <Box component="span" sx={{ color: "#ff4444" }}>
                        Out of Stock
                      </Box>
                    )}
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredSweets.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            background:
              "linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))",
            borderRadius: 3,
            border: "1px solid rgba(139, 69, 19, 0.15)",
            backdropFilter: "blur(16px)",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 600,
              background: "linear-gradient(135deg, #8B4513, #D2691E, #CD853F)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🔍 No Sweets Found
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No delicious treats match your current search criteria
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search filters
          </Typography>
        </Box>
      )}

      <Dialog
        open={purchaseDialog.open}
        onClose={() =>
          setPurchaseDialog({ open: false, sweet: null, quantity: 1 })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Purchase {purchaseDialog.sweet?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Price: ₹{purchaseDialog.sweet?.price.toFixed(2)} each
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available: {purchaseDialog.sweet?.quantity} in stock
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3 }}>
              <Typography variant="body1">Quantity:</Typography>
              <IconButton
                onClick={() =>
                  setPurchaseDialog((prev) => ({
                    ...prev,
                    quantity: Math.max(1, prev.quantity - 1),
                  }))
                }
                disabled={purchaseDialog.quantity <= 1}
              >
                <Remove />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ minWidth: 40, textAlign: "center" }}
              >
                {purchaseDialog.quantity}
              </Typography>
              <IconButton
                onClick={() =>
                  setPurchaseDialog((prev) => ({
                    ...prev,
                    quantity: Math.min(
                      prev.sweet?.quantity || 1,
                      prev.quantity + 1
                    ),
                  }))
                }
                disabled={
                  purchaseDialog.quantity >=
                  (purchaseDialog.sweet?.quantity || 0)
                }
              >
                <Add />
              </IconButton>
            </Box>

            <Typography variant="h6" sx={{ mt: 3 }}>
              Total: ₹
              {(
                (purchaseDialog.sweet?.price || 0) * purchaseDialog.quantity
              ).toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setPurchaseDialog({ open: false, sweet: null, quantity: 1 })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmPurchase}
            disabled={purchaseMutation.isLoading}
            startIcon={
              purchaseMutation.isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <ShoppingCart />
              )
            }
          >
            {purchaseMutation.isLoading ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ShopPage;
