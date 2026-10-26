import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured.');
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('_id');
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    next(error);
  }
};