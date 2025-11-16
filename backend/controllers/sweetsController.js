const Sweet = require('../models/Sweet');

const getAllSweets = async (req, res, next) => {
  try {
    const sweets = await Sweet.findAll();
    
    res.json({
      success: true,
      message: 'Sweets retrieved successfully',
      data: {
        sweets,
        count: sweets.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSweetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sweet = await Sweet.findById(id);
    
    if (!sweet) {
      return res.status(404).json({
        success: false,
        error: 'Sweet not found',
        message: `Sweet with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      message: 'Sweet retrieved successfully',
      data: { sweet }
    });
  } catch (error) {
    next(error);
  }
};

const createSweet = async (req, res, next) => {
  try {
    const sweetData = req.body;
    const sweet = await Sweet.create(sweetData);
    
    res.status(201).json({
      success: true,
      message: 'Sweet created successfully',
      data: { sweet }
    });
  } catch (error) {
    next(error);
  }
};

const updateSweet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sweetData = req.body;
    

    const existingSweet = await Sweet.findById(id);
    if (!existingSweet) {
      return res.status(404).json({
        success: false,
        error: 'Sweet not found',
        message: `Sweet with ID ${id} does not exist`
      });
    }


    const updatedData = {
      name: sweetData.name || existingSweet.name,
      category: sweetData.category || existingSweet.category,
      price: sweetData.price !== undefined ? sweetData.price : existingSweet.price,
      quantity: sweetData.quantity !== undefined ? sweetData.quantity : existingSweet.quantity,
      description: sweetData.description !== undefined ? sweetData.description : existingSweet.description,
      image_url: sweetData.image_url !== undefined ? sweetData.image_url : existingSweet.image_url
    };

    const sweet = await Sweet.update(id, updatedData);
    
    res.json({
      success: true,
      message: 'Sweet updated successfully',
      data: { sweet }
    });
  } catch (error) {
    next(error);
  }
};

const deleteSweet = async (req, res, next) => {
  try {
    const { id } = req.params;
    

    const existingSweet = await Sweet.findById(id);
    if (!existingSweet) {
      return res.status(404).json({
        success: false,
        error: 'Sweet not found',
        message: `Sweet with ID ${id} does not exist`
      });
    }

    const deleted = await Sweet.delete(id);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: 'Delete failed',
        message: 'Failed to delete sweet'
      });
    }

    res.json({
      success: true,
      message: 'Sweet deleted successfully',
      data: { deletedId: id }
    });
  } catch (error) {
    next(error);
  }
};

const searchSweets = async (req, res, next) => {
  try {
    const searchParams = req.query;
    const sweets = await Sweet.search(searchParams);
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        sweets,
        count: sweets.length,
        searchParams
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Sweet.getCategories();
    
    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSweets,
  getSweetById,
  createSweet,
  updateSweet,
  deleteSweet,
  searchSweets,
  getCategories
};
