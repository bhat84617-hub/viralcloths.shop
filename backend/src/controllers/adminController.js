const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Banner = require('../models/Banner');
const Setting = require('../models/Setting');

const getDashboard = async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalCustomers, totalRevenue] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email');
    const lowStockProducts = await Product.aggregate([
      { $match: { isActive: true } },
      { $addFields: { totalStock: { $sum: '$variants.stock' } } },
      { $sort: { totalStock: 1 } },
      { $limit: 5 },
      { $project: { name: 1, totalStock: 1, price: 1 } }
    ]);
    const pendingReviews = await Review.countDocuments({ isApproved: false });

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        lowStock: lowStockProducts,
        pendingReviews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'customer' };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const customers = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: customers.length, total, totalPages: Math.ceil(total / parseInt(limit)), customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
    res.json({ success: true, customer, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const { group } = req.query;
    const filter = group ? { group } : {};
    const settings = await Setting.find(filter).sort({ group: 1, key: 1 });
    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    });
    res.json({ success: true, settings: grouped, raw: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value, type, group, description } = req.body;
    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      if (type) setting.type = type;
      if (group) setting.group = group;
      if (description !== undefined) setting.description = description;
      await setting.save();
    } else {
      setting = await Setting.create({ key, value, type, group, description });
    }
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard, getCustomers, getCustomer, updateUserRole, toggleUserStatus, getSettings, updateSetting, uploadFile };
