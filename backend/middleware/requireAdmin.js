const ADMIN_SECRET = process.env.ADMIN_API_SECRET || 'sreytha-admin-v1-secret';

const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }
  next();
};

module.exports = requireAdmin;
