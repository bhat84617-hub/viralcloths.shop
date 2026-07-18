const Category = require('../models/Category');
const Product = require('../models/Product');

const getCategories = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = { parent: null };
    if (active === 'true') filter.isActive = true;

    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const subcategories = await Category.find({ parent: category._id }).sort({ sortOrder: 1 });
    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    res.json({ success: true, category, subcategories, productCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const subcategories = await Category.find({ parent: category._id }).sort({ sortOrder: 1 });
    res.json({ success: true, category, subcategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${productCount} products in this category` });
    }
    await Category.findByIdAndDelete(req.params.id);
    await Category.updateMany({ parent: req.params.id }, { parent: null });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCategories, getCategory, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
