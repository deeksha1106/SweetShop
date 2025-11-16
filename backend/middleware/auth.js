const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  

  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token' 
    });
  }
  

  const authHeaderCount = req.rawHeaders.filter(header => 
    header.toLowerCase() === 'authorization'
  ).length;
  
  if (authHeaderCount > 1) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token' 
    });
  }
  

  const authHeaderIndex = req.rawHeaders.findIndex(header => 
    header.toLowerCase() === 'authorization'
  );
  
  if (authHeaderIndex !== -1 && authHeaderIndex + 1 < req.rawHeaders.length) {
    const rawAuthValue = req.rawHeaders[authHeaderIndex + 1];
    

    if (rawAuthValue !== rawAuthValue.trim()) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }
  }
  


  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token' 
    });
  }
  

  const parts = authHeader.split(' ').filter(part => part.length > 0);
  

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token' 
    });
  }
  
  const token = parts[1];
  

  if (!token || token.trim() === '') {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    if (!decoded.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        message: 'Token verification failed' 
      });
    }
    


    let user = null;
    if (decoded.userId && typeof decoded.userId === 'number') {
      user = await User.findById(decoded.userId);
    }
    

    if (user) {
      req.user = user;
    } else {

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        ...decoded
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        message: 'Please log in again' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token',
      message: 'Token verification failed' 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required',
      message: 'This action requires administrator privileges' 
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      req.user = user;
    } catch (error) {

      req.user = null;
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
