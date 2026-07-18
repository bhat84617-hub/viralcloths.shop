const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `"ViralClothes.Shop" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
};

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your email - ViralClothes.Shop',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
        <h2 style="color:#6C3CE1">Welcome to ViralClothes.Shop!</h2>
        <p style="color:#555;line-height:1.6">Please verify your email address by clicking the button below.</p>
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6C3CE1,#E84393);color:#fff;text-decoration:none;border-radius:50px;font-weight:600;margin:20px 0">Verify Email</a>
        <p style="color:#999;font-size:13px">This link expires in 24 hours.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your password - ViralClothes.Shop',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
        <h2 style="color:#6C3CE1">Reset Your Password</h2>
        <p style="color:#555;line-height:1.6">Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6C3CE1,#E84393);color:#fff;text-decoration:none;border-radius:50px;font-weight:600;margin:20px 0">Reset Password</a>
        <p style="color:#999;font-size:13px">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
};

const sendOrderConfirmation = async (email, order) => {
  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
        <h2 style="color:#6C3CE1">Order Confirmed!</h2>
        <p style="color:#555">Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
        <p style="color:#555">Total: $${order.total.toFixed(2)}</p>
        <p style="color:#999;font-size:13px">You'll receive a shipping confirmation once your order ships.</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmation };
