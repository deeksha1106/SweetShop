const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');


router.get('/purchases',
  authenticateToken,
  inventoryController.getPurchaseHistory
);


router.get('/logs',
  authenticateToken,
  requireAdmin,
  inventoryController.getInventoryLogs
);


router.get('/logs/:id',
  authenticateToken,
  requireAdmin,
  inventoryController.getInventoryLogs
);


router.get('/stats',
  authenticateToken,
  requireAdmin,
  inventoryController.getInventoryStats
);

module.exports = router;
