const Sweet = require('../models/Sweet');

const purchaseSweet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id || req.user.userId;
    

    const sweetId = parseInt(id, 10);
    



    const sweet = await Sweet.findById(sweetId);
    if (!sweet) {
      return res.status(404).json({
        success: false,
        error: 'Sweet not found',
        message: `Sweet with ID ${id} does not exist`
      });
    }


    if (sweet.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock',
        message: `Only ${sweet.quantity} items available in stock`
      });
    }


    const result = await Sweet.purchase(sweetId, quantity, userId);
    
    res.json({
      success: true,
      message: 'Purchase completed successfully',
      data: {
        sweet: result.sweet,
        purchase: result.purchase,
        message: `Successfully purchased ${quantity} ${sweet.name}(s) for $${result.purchase.totalPrice.toFixed(2)}`
      }
    });
  } catch (error) {
    if (error.message === 'Sweet not found' || error.message === 'Insufficient quantity in stock') {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message
      });
    }
    next(error);
  }
};

const restockSweet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id || req.user.userId;


    const existingSweet = await Sweet.findById(id);
    if (!existingSweet) {
      return res.status(404).json({
        success: false,
        error: 'Sweet not found',
        message: `Sweet with ID ${id} does not exist`
      });
    }


    const sweet = await Sweet.restock(id, quantity, userId);
    
    res.json({
      success: true,
      message: 'Restock completed successfully',
      data: {
        sweet,
        restocked: quantity,
        previousQuantity: existingSweet.quantity,
        newQuantity: sweet.quantity,
        message: `Successfully restocked ${quantity} ${sweet.name}(s). New stock: ${sweet.quantity}`
      }
    });
  } catch (error) {
    if (error.message === 'Sweet not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message
      });
    }
    next(error);
  }
};

const getPurchaseHistory = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const purchases = await Sweet.getPurchaseHistory(userId);
    
    res.json({
      success: true,
      message: 'Purchase history retrieved successfully',
      data: {
        purchases,
        count: purchases.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await Sweet.getInventoryLogs(id);
    
    res.json({
      success: true,
      message: 'Inventory logs retrieved successfully',
      data: {
        logs,
        count: logs.length,
        sweetId: id || 'all'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryStats = async (req, res, next) => {
  try {
    const sweets = await Sweet.findAll();
    
    const stats = {
      totalSweets: sweets.length,
      totalValue: sweets.reduce((sum, sweet) => sum + (sweet.price * sweet.quantity), 0),
      outOfStock: sweets.filter(sweet => sweet.quantity === 0).length,
      lowStock: sweets.filter(sweet => sweet.quantity > 0 && sweet.quantity <= 10).length,
      inStock: sweets.filter(sweet => sweet.quantity > 10).length,
      categories: {}
    };


    sweets.forEach(sweet => {
      if (!stats.categories[sweet.category]) {
        stats.categories[sweet.category] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }
      stats.categories[sweet.category].count++;
      stats.categories[sweet.category].totalQuantity += sweet.quantity;
      stats.categories[sweet.category].totalValue += sweet.price * sweet.quantity;
    });

    res.json({
      success: true,
      message: 'Inventory statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  purchaseSweet,
  restockSweet,
  getPurchaseHistory,
  getInventoryLogs,
  getInventoryStats
};
