const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details.map(d => d.message)
      });
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Query validation error',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
};


const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('user', 'admin').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  createSweet: Joi.object({
    name: Joi.string().trim().min(1).max(255).required().messages({
      'string.min': 'Sweet name cannot be empty',
      'string.max': 'Sweet name cannot exceed 255 characters',
      'any.required': 'Name is required'
    }),
    category: Joi.string().trim().min(1).max(100).required().messages({
      'string.min': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters',
      'any.required': 'Category is required'
    }),
    price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),
    quantity: Joi.number().integer().min(0).default(0).messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity cannot be negative'
    }),
    description: Joi.string().trim().max(1000).optional().allow('').messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    image_url: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Image URL must be a valid URL'
    })
  }),

  updateSweet: Joi.object({
    name: Joi.string().min(1).max(255).optional().messages({
      'string.min': 'Sweet name cannot be empty',
      'string.max': 'Sweet name cannot exceed 255 characters'
    }),
    category: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'Category cannot be empty',
      'string.max': 'Category cannot exceed 100 characters'
    }),
    price: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Price must be a positive number'
    }),
    quantity: Joi.number().integer().min(0).optional().messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity cannot be negative'
    }),
    description: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    image_url: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Image URL must be a valid URL'
    })
  }),

  purchase: Joi.object({
    quantity: Joi.number().integer().positive().required().messages({
      'number.integer': 'Quantity must be a whole number',
      'number.positive': 'Quantity must be greater than 0',
      'any.required': 'Quantity is required'
    })
  }),

  restock: Joi.object({
    quantity: Joi.number().integer().positive().required().messages({
      'number.integer': 'Quantity must be a whole number',
      'number.positive': 'Quantity must be greater than 0',
      'any.required': 'Quantity is required'
    })
  }),

  searchSweets: Joi.object({
    name: Joi.string().optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional().messages({
      'number.min': 'Minimum price cannot be negative'
    }),
    maxPrice: Joi.number().min(0).optional().messages({
      'number.min': 'Maximum price cannot be negative'
    }),
    inStock: Joi.boolean().optional()
  })
};


const validateSweetData = validateRequest(schemas.createSweet);
const validateUserData = validateRequest(schemas.register);
const validatePurchaseData = validateRequest(schemas.purchase);
const validateRestockData = validateRequest(schemas.restock);
const validateLoginData = validateRequest(schemas.login);
const validateUpdateSweetData = validateRequest(schemas.updateSweet);
const validateSearchQuery = validateQuery(schemas.searchSweets);

module.exports = {
  validateRequest,
  validateQuery,
  schemas,

  validateSweetData,
  validateUserData,
  validatePurchaseData,
  validateRestockData,
  validateLoginData,
  validateUpdateSweetData,
  validateSearchQuery
};
