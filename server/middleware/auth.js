import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJWTSecret = () => process.env.JWT_SECRET;

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied.' });
    }

    const token = authHeader.split(' ')[1];
    const verified = jwt.verify(token, getJWTSecret());
    
    if (!verified) {
      return res.status(401).json({ message: 'Token verification failed, access denied.' });
    }

    const user = await User.findById(verified.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization failed.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: err.message, message: 'Invalid token, authorization failed.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Administrative privileges required.' });
  }
  next();
};
