const Brand = require('../models/Brand');
const Product = require('../models/Product');

const getBrands = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.isActive = true;
    const brands = await Brand.find(filter).sort({ name: 1 });
    res.json({ success: true, count: brands.length, brands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    const productCount = await Product.countDocuments({ brand: brand._id, isActive: true });
    res.json({ success: true, brand, productCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const count = await Product.countDocuments({ brand: req.params.id });
    if (count > 0) return res.status(400).json({ success: false, message: `Cannot delete: ${count} products use this brand` });
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBrands, getBrand, createBrand, updateBrand, deleteBrand };
