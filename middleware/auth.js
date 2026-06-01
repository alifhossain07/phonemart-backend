const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { toObjectId } = require('../utils/helpers');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = getDB();
    const userId = toObjectId(decoded.userId);
    
    if (!userId) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'Invalid token format'
      });
    }
    
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      result: false,
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin middleware (requires admin role)
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = getDB();
    const userId = toObjectId(decoded.userId);
    
    if (!userId) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'Invalid token format'
      });
    }
    
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return res.status(401).json({
        result: false,
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        result: false,
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(401).json({
      result: false,
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;

