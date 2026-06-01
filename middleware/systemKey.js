const systemKeyMiddleware = (req, res, next) => {
  const systemKey = req.headers['system-key'] || req.headers['System-Key'];
  const expectedKey = process.env.SYSTEM_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'System key not configured'
    });
  }

  if (systemKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid system key'
    });
  }

  next();
};

module.exports = systemKeyMiddleware;

