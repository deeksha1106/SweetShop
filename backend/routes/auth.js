const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');


router.post('/register', 
  validateRequest(schemas.register),
  authController.register
);


router.post('/login',
  validateRequest(schemas.login),
  authController.login
);


router.get('/profile',
  authenticateToken,
  authController.getProfile
);


router.post('/refresh',
  authenticateToken,
  authController.refreshToken
);

module.exports = router;
