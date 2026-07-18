const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { adminOnly, superAdminOnly } = require('../middleware/adminAuth');
const {
  getDashboard, getCustomers, getCustomer,
  updateUserRole, toggleUserStatus,
  getSettings, updateSetting, uploadFile
} = require('../controllers/adminController');
const { getOrders, getOrder } = require('../controllers/orderController');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { approveReview } = require('../controllers/reviewController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_PATH || './uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.put('/customers/:id/role', superAdminOnly, updateUserRole);
router.put('/customers/:id/toggle-status', toggleUserStatus);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

router.put('/reviews/:id/approve', approveReview);

router.get('/gift-cards', require('../controllers/giftCardController').getAllGiftCards);
router.post('/gift-cards', require('../controllers/giftCardController').createGiftCard);
router.put('/gift-cards/:id', require('../controllers/giftCardController').updateGiftCard);
router.delete('/gift-cards/:id', require('../controllers/giftCardController').deleteGiftCard);

router.get('/shipping-methods', require('../controllers/shippingMethodController').getAllShippingMethods);
router.post('/shipping-methods', require('../controllers/shippingMethodController').createShippingMethod);
router.put('/shipping-methods/:id', require('../controllers/shippingMethodController').updateShippingMethod);
router.delete('/shipping-methods/:id', require('../controllers/shippingMethodController').deleteShippingMethod);

router.get('/settings', getSettings);
router.put('/settings', updateSetting);

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
