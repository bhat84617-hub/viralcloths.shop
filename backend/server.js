const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const brandRoutes = require('./src/routes/brandRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const shippingMethodRoutes = require('./src/routes/shippingMethodRoutes');
const giftCardRoutes = require('./src/routes/giftCardRoutes');
const addressRoutes = require('./src/routes/addressRoutes');
const seoRoutes = require('./src/routes/seoRoutes');
const { getRobotsTxt, getManifest, getSitemapXml, getSitemapHtml } = require('./src/controllers/seoController');
const { stripeWebhook } = require('./src/controllers/paymentController');

const app = express();

connectDB();

['logs', 'uploads'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Stripe webhook needs raw body BEFORE JSON parser
app.post('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..'), { dotfiles: 'deny', index: ['index.html'] }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ViralClothes API is running', timestamp: new Date().toISOString() });
});

// Diagnostic endpoint
app.get('/api/debug', (req, res) => {
  const { getDBStatus } = require('./src/config/db');
  res.json({
    dbConnected: getDBStatus(),
    mongoUriSet: !!(process.env.MONGO_URI || process.env.MONGODB_URI),
    nodeEnv: process.env.NODE_ENV
  });
});

// One-time seed endpoint
app.post('/api/seed', async (req, res) => {
  if (req.query.key !== 'viralclothes_seed_2026') return res.status(401).json({ success: false, message: 'Invalid key' });
  try {
    const { seed } = require('./src/seeds/seed');
    await seed();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping-methods', shippingMethodRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/addresses', addressRoutes);

// SEO routes
app.get('/seo/robots.txt', getRobotsTxt);
app.get('/seo/manifest.json', getManifest);
app.get('/seo/sitemap.xml', getSitemapXml);
app.get('/seo/sitemap.html', getSitemapHtml);
app.use('/api/seo', seoRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ViralClothes API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
