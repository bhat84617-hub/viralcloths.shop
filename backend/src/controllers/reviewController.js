const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { product: req.params.productId, isApproved: true };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const avgRating = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({ success: true, count: reviews.length, total, totalPages: Math.ceil(total / parseInt(limit)), reviews, avgRating: avgRating[0]?.avg || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });

    const hasPurchased = await Order.findOne({ user: req.user._id, 'items.product': req.params.productId, orderStatus: 'delivered' });
    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      rating,
      title,
      comment,
      isVerified: !!hasPurchased,
      isApproved: false
    });

    const stats = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(req.params.productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        numReviews: stats[0].count
      });
    }

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProductReviews, createReview, updateReview, deleteReview, approveReview };
