const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendOrderConfirmation } = require('../utils/sendEmail');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      if (product.isOutOfStock) return res.status(400).json({ success: false, message: `${product.name} is out of stock` });

      const price = product.salePrice > 0 ? product.salePrice : product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id, name: product.name, icon: product.icon || '',
        image: product.thumbnail || '', price, quantity: item.quantity,
        size: item.size || '', color: item.color || '', sku: item.sku || ''
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        discountAmount = coupon.type === 'percentage' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.value;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const shippingCost = subtotal >= 50 ? 0 : 9.99;
    const taxAmount = subtotal * 0.08;
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    const orderData = {
      items: orderItems, subtotal, shippingCost, taxAmount, discountAmount,
      couponCode: couponCode || '', total, shippingAddress, paymentMethod,
      notes: notes || '', orderStatus: 'confirmed', paymentStatus: 'paid',
      isPaid: true, paidAt: new Date(),
      statusHistory: [{ status: 'confirmed', note: 'Order placed successfully' }]
    };

    if (req.user) orderData.user = req.user._id;
    else {
      if (!shippingAddress?.email) return res.status(400).json({ success: false, message: 'Email is required for guest checkout' });
      orderData.guestEmail = shippingAddress.email;
    }

    const order = await Order.create(orderData);

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { totalSold: item.quantity } });
    }

    const isPaid = paymentMethod !== 'cod';
    if (isPaid) { await Order.findByIdAndUpdate(order._id, { isPaid: true, paidAt: new Date(), paymentStatus: 'paid' }); }

    const email = req.user ? req.user.email : shippingAddress?.email;
    await sendOrderConfirmation(email, order);

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (req.user && req.user.role === 'customer') filter.user = req.user._id;
    if (status) filter.orderStatus = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: orders.length, total, totalPages: Math.ceil(total / parseInt(limit)), orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user && req.user.role === 'customer' && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.number }).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl, carrier, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.orderStatus = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
    if (carrier !== undefined) order.carrier = carrier;
    if (status === 'delivered') order.deliveredAt = new Date();
    order.statusHistory.push({ status, note: note || `Status changed to ${status}`, updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order that has been shipped' });
    }
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { totalSold: -item.quantity } });
    }
    order.orderStatus = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Order cancelled', updatedBy: req.user?._id });
    await order.save();
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'delivered') return res.status(400).json({ success: false, message: 'Can only return delivered orders' });
    order.orderStatus = 'return_requested';
    order.statusHistory.push({ status: 'return_requested', note: reason || 'Return requested', updatedBy: req.user?._id });
    await order.save();
    res.json({ success: true, message: 'Return requested', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order, invoice: generateInvoiceData(order) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function generateInvoiceData(order) {
  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    dueDate: order.createdAt,
    from: { name: 'ViralClothes.Shop', email: process.env.EMAIL_FROM || 'support@viralclothes.shop' },
    to: { name: order.shippingAddress?.fullName || 'Customer', email: order.shippingAddress?.email || '' },
    items: order.items,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress
  };
}

const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalCustomers = await require('../models/User').countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email');
    const revenueByMonth = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, stats: { totalOrders, totalRevenue: totalRevenue[0]?.total || 0, totalCustomers, totalProducts, recentOrders, revenueByMonth } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const processRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'refunded') return res.status(400).json({ success: false, message: 'Already refunded' });
    order.paymentStatus = 'refunded';
    order.orderStatus = 'cancelled';
    order.statusHistory.push({ status: 'refunded', note: 'Refund processed by admin', updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, message: 'Order refunded', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrder, getOrders, getOrder, getOrderByNumber, updateOrderStatus, cancelOrder, requestReturn, getInvoice, getDashboardStats, processRefund };
