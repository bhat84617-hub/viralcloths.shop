const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation, updateProfileValidation } = require('../validators/authValidator');
const {
  register, login, logout, refreshTokenHandler,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword, changePassword,
  getProfile, updateProfile
} = require('../controllers/authController');

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshTokenHandler);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);
router.post('/change-password', protect, changePasswordValidation, changePassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, updateProfile);

module.exports = router;
