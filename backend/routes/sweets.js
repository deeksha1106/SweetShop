const express = require('express');
const router = express.Router();
const sweetsController = require('../controllers/sweetsController');
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, validateQuery, schemas } = require('../middleware/validation');


router.get('/',
  authenticateToken,
  sweetsController.getAllSweets
);


router.get('/search',
  authenticateToken,
  validateQuery(schemas.searchSweets),
  sweetsController.searchSweets
);


router.get('/categories',
  authenticateToken,
  sweetsController.getCategories
);


router.get('/:id',
  authenticateToken,
  sweetsController.getSweetById
);


router.post('/',
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.createSweet),
  sweetsController.createSweet
);


router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.updateSweet),
  sweetsController.updateSweet
);


router.delete('/:id',
  authenticateToken,
  requireAdmin,
  sweetsController.deleteSweet
);


router.post('/:id/purchase',
  authenticateToken,
  validateRequest(schemas.purchase),
  inventoryController.purchaseSweet
);


router.post('/:id/restock',
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.restock),
  inventoryController.restockSweet
);

module.exports = router;
