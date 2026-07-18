const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin only.' });
  }
  next();
};

module.exports = { adminOnly, superAdminOnly };
