const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const GiftCard = require('../models/GiftCard');
const ShippingMethod = require('../models/ShippingMethod');
const PaymentTransaction = require('../models/PaymentTransaction');
const gatewayFactory = require('../payments/GatewayFactory');
const { sendOrderConfirmation } = require('../utils/sendEmail');

const _calculateOrder = async (items, shippingMethodId, couponCode, giftCardCode, country) => {
  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId || item.product);
    if (!product) throw new Error(`Product not found`);
    const price = product.salePrice > 0 ? product.salePrice : product.price;
    subtotal += price * item.quantity;
    orderItems.push({ product: product._id, name: product.name, icon: product.icon || '', image: product.thumbnail || '', price, quantity: item.quantity, size: item.size || '', color: item.color || '', sku: item.sku || '' });
  }
  let shippingCost = 0;
  if (shippingMethodId) {
    const method = await ShippingMethod.findById(shippingMethodId);
    if (method) shippingCost = subtotal >= method.freeThreshold && method.freeThreshold > 0 ? 0 : method.price;
  } else shippingCost = subtotal >= 50 ? 0 : 9.99;
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (coupon && subtotal >= coupon.minOrderAmount) discountAmount = coupon.type === 'percentage' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.value;
  }
  let giftCardDiscount = 0;
  if (giftCardCode) {
    const gc = await GiftCard.findOne({ code: giftCardCode.toUpperCase(), isActive: true });
    if (gc && gc.balance > 0) giftCardDiscount = Math.min(gc.balance, subtotal - discountAmount);
  }
  const taxAmount = Math.max(0, (subtotal - discountAmount - giftCardDiscount) * 0.08);
  const total = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount - giftCardDiscount);
  const currency = (country || '').toUpperCase() === 'IN' ? 'INR' : 'USD';
  return { orderItems, subtotal, shippingCost, taxAmount, discountAmount, giftCardDiscount, total, currency };
};

const _createPaymentTransaction = async (data) => {
  return PaymentTransaction.create(data);
};

const _completeOrder = async (orderData, paymentResult, country) => {
  const email = orderData.email;
  const order = await Order.create(orderData.order);
  await sendOrderConfirmation(email, order);
  return order;
};

// Gateway-agnostic: initiate payment via the appropriate gateway
const initiatePayment = async (req, res) => {
  try {
    const { items, shippingMethodId, couponCode, giftCardCode, gateway: preferredGateway, country } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const customerCountry = country || req.body.shippingAddress?.country || 'US';
    const calc = await _calculateOrder(items, shippingMethodId, couponCode, giftCardCode, customerCountry);

    const gateway = preferredGateway
      ? gatewayFactory.get(preferredGateway)
      : gatewayFactory.getPrimaryForCountry(customerCountry);
    if (!gateway) return res.status(400).json({ success: false, message: 'No payment gateway available for your country' });

    const paymentResult = await gateway.createPayment({
      items, subtotal: calc.subtotal, shippingCost: calc.shippingCost,
      taxAmount: calc.taxAmount, discountAmount: calc.discountAmount,
      total: calc.total, currency: calc.currency, country: customerCountry
    });

    const transaction = await _createPaymentTransaction({
      gateway: gateway.name,
      transactionId: paymentResult.transactionId,
      gatewayOrderId: paymentResult.razorpayOrderId || paymentResult.metadata?.orderId || '',
      amount: calc.total,
      currency: calc.currency,
      status: 'pending',
      customerCountry,
      metadata: paymentResult.metadata || {},
      gatewayResponse: { ...paymentResult }
    });

    res.json({
      success: true,
      gateway: gateway.name,
      transactionId: transaction._id,
      paymentResult,
      breakdown: {
        subtotal: Math.round(calc.subtotal * 100) / 100,
        shippingCost: Math.round(calc.shippingCost * 100) / 100,
        taxAmount: Math.round(calc.taxAmount * 100) / 100,
        discountAmount: Math.round(calc.discountAmount * 100) / 100,
        giftCardDiscount: Math.round(calc.giftCardDiscount * 100) / 100,
        total: Math.round(calc.total * 100) / 100,
        currency: calc.currency
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Confirm payment and create order
const completePayment = async (req, res) => {
  try {
    const { transactionId, shippingAddress, shippingMethodId, couponCode, giftCardCode, notes, razorpayData } = req.body;

    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const gateway = gatewayFactory.get(transaction.gateway);
    if (!gateway) return res.status(400).json({ success: false, message: 'Gateway not found' });

    let confirmation;
    if (transaction.gateway === 'razorpay' && razorpayData) {
      confirmation = await gateway.confirmPayment(razorpayData);
    } else if (transaction.gateway === 'paypal') {
      const { orderID } = req.body;
      confirmation = await gateway.confirmPayment({ transactionId: orderID || transaction.transactionId });
    } else {
      confirmation = await gateway.confirmPayment({ transactionId: transaction.transactionId });
    }

    if (!confirmation.success) {
      transaction.status = 'failed';
      transaction.errorMessage = confirmation.error || 'Payment confirmation failed';
      await transaction.save();
      return res.status(400).json({ success: false, message: confirmation.error || 'Payment failed' });
    }

    transaction.status = confirmation.status === 'completed' ? 'completed' : 'processing';
    transaction.gatewayResponse = { ...transaction.gatewayResponse, confirmation };
    transaction.isVerified = true;
    transaction.verifiedAt = new Date();
    if (confirmation.transactionId) transaction.transactionId = confirmation.transactionId;
    if (confirmation.metadata) transaction.metadata = { ...transaction.metadata, ...confirmation.metadata };
    await transaction.save();

    const items = req.body.items || [];
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      const price = product.salePrice > 0 ? product.salePrice : product.price;
      subtotal += price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, icon: product.icon || '', image: product.thumbnail || '', price, quantity: item.quantity, size: item.size || '', color: item.color || '', sku: item.sku || '' });
      await Product.findByIdAndUpdate(product._id, { $inc: { totalSold: item.quantity } });
    }

    let shippingCost = 0;
    if (shippingMethodId) {
      const method = await ShippingMethod.findById(shippingMethodId);
      if (method) shippingCost = subtotal >= method.freeThreshold && method.freeThreshold > 0 ? 0 : method.price;
    } else shippingCost = subtotal >= 50 ? 0 : 9.99;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (coupon && subtotal >= coupon.minOrderAmount) { discountAmount = coupon.type === 'percentage' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.value; coupon.usedCount += 1; await coupon.save(); }
    }
    let giftCardDiscount = 0;
    if (giftCardCode) {
      const gc = await GiftCard.findOne({ code: giftCardCode.toUpperCase(), isActive: true });
      if (gc && gc.balance > 0) { const used = Math.min(gc.balance, subtotal - discountAmount); gc.balance -= used; if (req.user?._id) gc.usedBy.push(req.user._id); if (gc.balance <= 0) gc.isActive = false; await gc.save(); giftCardDiscount = used; }
    }

    const taxAmount = Math.max(0, (subtotal - discountAmount - giftCardDiscount) * 0.08);
    const total = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount - giftCardDiscount);

    const order = await Order.create({
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      giftCardDiscount: Math.round(giftCardDiscount * 100) / 100,
      couponCode: couponCode || '', total: Math.round(total * 100) / 100,
      shippingAddress, paymentMethod: transaction.gateway,
      paymentStatus: 'paid', paymentId: transaction.transactionId,
      isPaid: true, paidAt: new Date(), orderStatus: 'confirmed',
      statusHistory: [{ status: 'confirmed', note: `Payment confirmed via ${gateway.displayName}` }],
      user: req.user?._id, guestEmail: shippingAddress?.email || '', notes: notes || ''
    });

    transaction.order = order._id;
    transaction.orderNumber = order.orderNumber;
    await transaction.save();

    const email = req.user ? req.user.email : shippingAddress?.email;
    await sendOrderConfirmation(email, order);

    res.status(201).json({ success: true, order, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Razorpay-specific: create order (returns razorpay orderId)
const createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingMethodId, couponCode, giftCardCode, shippingAddress } = req.body;
    const customerCountry = 'IN';
    const calc = await _calculateOrder(items, shippingMethodId, couponCode, giftCardCode, customerCountry);
    const gateway = gatewayFactory.get('razorpay');
    if (!gateway) return res.status(400).json({ success: false, message: 'Razorpay not configured' });

    const result = await gateway.createPayment({
      items, subtotal: calc.subtotal, total: calc.total, currency: 'INR', country: 'IN'
    });

    const transaction = await _createPaymentTransaction({
      gateway: 'razorpay', transactionId: result.razorpayOrderId,
      gatewayOrderId: result.razorpayOrderId, amount: calc.total, currency: 'INR',
      status: 'pending', customerCountry: 'IN', metadata: result.metadata || {}
    });

    res.json({
      success: true,
      razorpayOrderId: result.razorpayOrderId,
      transactionId: transaction._id,
      amount: calc.total,
      currency: 'INR',
      gatewayConfig: gateway.getClientConfig()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Confirm Razorpay payment
const confirmRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddress, shippingMethodId, couponCode, giftCardCode, notes, items } = req.body;
    const gateway = gatewayFactory.get('razorpay');
    if (!gateway) return res.status(400).json({ success: false, message: 'Razorpay not configured' });

    const transaction = await PaymentTransaction.findOne({ gatewayOrderId: razorpayOrderId });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const confirmation = await gateway.confirmPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!confirmation.success) {
      transaction.status = 'failed'; transaction.errorMessage = confirmation.error || 'Verification failed';
      await transaction.save();
      return res.status(400).json({ success: false, message: confirmation.error || 'Payment verification failed' });
    }

    transaction.status = 'completed'; transaction.transactionId = razorpayPaymentId;
    transaction.isVerified = true; transaction.verifiedAt = new Date();
    transaction.gatewayResponse = { ...transaction.gatewayResponse, confirmation };
    await transaction.save();

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      const price = product?.salePrice > 0 ? product.salePrice : (product?.price || 0);
      subtotal += price * item.quantity;
      orderItems.push({ product: product?._id, name: product?.name || item.name, icon: product?.icon || '', price, quantity: item.quantity, size: item.size || '', color: item.color || '' });
      if (product) await Product.findByIdAndUpdate(product._id, { $inc: { totalSold: item.quantity } });
    }

    let discountAmount = 0;
    let giftCardDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (coupon && subtotal >= coupon.minOrderAmount) { discountAmount = coupon.type === 'percentage' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.value; coupon.usedCount += 1; await coupon.save(); }
    }
    if (giftCardCode) {
      const gc = await GiftCard.findOne({ code: giftCardCode.toUpperCase(), isActive: true });
      if (gc && gc.balance > 0) { const used = Math.min(gc.balance, subtotal - discountAmount); gc.balance -= used; if (req.user?._id) gc.usedBy.push(req.user._id); if (gc.balance <= 0) gc.isActive = false; await gc.save(); giftCardDiscount = used; }
    }
    let shippingCost = subtotal >= 50 ? 0 : 9.99;
    const taxAmount = Math.max(0, (subtotal - discountAmount - giftCardDiscount) * 0.08);
    const total = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount - giftCardDiscount);

    const order = await Order.create({
      items: orderItems, subtotal, shippingCost, taxAmount, discountAmount, giftCardDiscount, couponCode, total,
      shippingAddress, paymentMethod: 'razorpay', paymentStatus: 'paid',
      paymentId: razorpayPaymentId, isPaid: true, paidAt: new Date(), orderStatus: 'confirmed',
      statusHistory: [{ status: 'confirmed', note: 'Payment confirmed via Razorpay' }],
      user: req.user?._id, guestEmail: shippingAddress?.email || '', notes: notes || ''
    });

    transaction.order = order._id; transaction.orderNumber = order.orderNumber;
    await transaction.save();

    const email = req.user ? req.user.email : shippingAddress?.email;
    await sendOrderConfirmation(email, order);

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get available gateways for a country
const getAvailableGateways = (req, res) => {
  const { country } = req.query;
  const config = gatewayFactory.getAllClientConfig(country || 'US');
  res.json({ success: true, ...config });
};

// Webhook handler (routes to the right gateway)
const webhookHandler = async (req, res) => {
  const gateway = req.params.gateway;
  const instance = gatewayFactory.get(gateway);
  if (!instance) return res.status(400).json({ success: false, message: 'Unknown gateway' });

  const signature = gateway === 'stripe' ? req.headers['stripe-signature']
    : gateway === 'razorpay' ? req.headers['x-razorpay-signature']
    : req.headers['paypal-transmission-id'] || '';

  const result = await instance.verifyWebhook(req.body, signature);
  if (!result.success) return res.status(400).json({ success: false, message: result.error });

  const event = result.event;
  const eventType = gateway === 'stripe' ? event.type
    : gateway === 'razorpay' ? event.event
    : event.event_type || '';

  if (eventType.includes('succeeded') || eventType.includes('completed') || eventType.includes('paid')) {
    const paymentId = gateway === 'stripe' ? event.data?.object?.id
      : gateway === 'razorpay' ? event.payload?.payment?.entity?.id
      : event.resource?.id || '';
    if (paymentId) {
      await PaymentTransaction.findOneAndUpdate(
        { transactionId: paymentId },
        { status: 'completed', isVerified: true, verifiedAt: new Date() }
      );
    }
  }

  res.json({ received: true });
};

// Refund via gateway
const processRefund = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const transaction = await PaymentTransaction.findOne({ order: orderId, status: 'completed' });
    if (!transaction) return res.status(400).json({ success: false, message: 'No completed transaction found for this order' });

    const gateway = gatewayFactory.get(transaction.gateway);
    if (!gateway) return res.status(400).json({ success: false, message: 'Gateway not available' });

    const refund = await gateway.processRefund(transaction, amount || transaction.amount);
    if (!refund.success) return res.status(400).json({ success: false, message: refund.error || 'Refund failed' });

    transaction.status = amount && amount < transaction.amount ? 'partially_refunded' : 'refunded';
    transaction.refundAmount = (transaction.refundAmount || 0) + (refund.amount || amount || transaction.amount);
    transaction.refundId = refund.refundId || '';
    await transaction.save();

    order.paymentStatus = transaction.status;
    order.orderStatus = transaction.status === 'refunded' ? 'cancelled' : order.orderStatus;
    order.statusHistory.push({ status: transaction.status, note: `Refund of $${(refund.amount || amount || transaction.amount).toFixed(2)} via ${transaction.gateway}`, updatedBy: req.user._id });
    await order.save();

    res.json({ success: true, refund, transaction, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Payment history for admin
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, gateway, status } = req.query;
    const filter = {};
    if (gateway) filter.gateway = gateway;
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await PaymentTransaction.countDocuments(filter);
    const transactions = await PaymentTransaction.find(filter)
      .populate('order', 'orderNumber total')
      .populate('user', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: transactions.length, total, totalPages: Math.ceil(total / parseInt(limit)), transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPaymentTransaction = async (req, res) => {
  try {
    const t = await PaymentTransaction.findById(req.params.id).populate('order').populate('user', 'name email');
    if (!t) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction: t });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Legacy support (unchanged interface)
const createPaymentIntent = async (req, res) => {
  const gateway = gatewayFactory.get('stripe');
  if (!gateway) return res.status(400).json({ success: false, message: 'Stripe not configured' });
  try {
    const { items, shippingMethodId, couponCode, giftCardCode } = req.body;
    const calc = await _calculateOrder(items, shippingMethodId, couponCode, giftCardCode, 'US');
    const result = await gateway.createPayment({ items, subtotal: calc.subtotal, total: calc.total, currency: 'USD' });
    await _createPaymentTransaction({ gateway: 'stripe', transactionId: result.transactionId, amount: calc.total, currency: 'USD', status: 'pending', customerCountry: 'US', metadata: result.metadata || {} });
    res.json({ success: true, clientSecret: result.clientSecret, paymentIntentId: result.transactionId, breakdown: calc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmPayment = async (req, res) => {
  const { paymentIntentId, items, shippingAddress, shippingMethodId, couponCode, giftCardCode, notes } = req.body;
  const gateway = gatewayFactory.get('stripe');
  const result = await gateway.confirmPayment({ transactionId: paymentIntentId });
  if (!result.success) return res.status(400).json({ success: false, message: result.error || 'Payment failed' });
  req.body.transactionId = (await PaymentTransaction.findOne({ transactionId: paymentIntentId }))?._id;
  return completePayment(req, res);
};

const createPayPalOrder = async (req, res) => {
  const gateway = gatewayFactory.get('paypal');
  try {
    const { items, shippingAddress } = req.body;
    let subtotal = 0;
    for (const item of items) { const p = await Product.findById(item.productId || item.product); subtotal += (p?.salePrice || p?.price || 0) * item.quantity; }
    const total = subtotal + (subtotal >= 50 ? 0 : 9.99);
    const result = await gateway.createPayment({ items, total, currency: 'USD' });
    await _createPaymentTransaction({ gateway: 'paypal', transactionId: result.transactionId, amount: total, currency: 'USD', status: 'pending', customerCountry: shippingAddress?.country || 'US', metadata: result.metadata || {} });
    res.json({ success: true, orderID: result.metadata.orderID, transactionId: result.transactionId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const capturePayPalOrder = async (req, res) => {
  req.body.transactionId = req.body.orderID;
  return completePayment(req, res);
};

const stripeWebhook = async (req, res) => {
  req.params = { ...req.params, gateway: 'stripe' };
  return webhookHandler(req, res);
};

module.exports = {
  initiatePayment, completePayment, createRazorpayOrder, confirmRazorpayPayment,
  getAvailableGateways, webhookHandler, processRefund, getPaymentHistory, getPaymentTransaction,
  createPaymentIntent, confirmPayment, createPayPalOrder, capturePayPalOrder, stripeWebhook
};
