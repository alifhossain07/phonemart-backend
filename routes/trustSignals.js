const express = require('express');
const { getDB } = require('../config/database');

const router = express.Router();

// Get trust signals
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const trustSignals = await db.collection('trust_signals')
      .find({ active: true })
      .sort({ order: 1, created_at: -1 })
      .toArray();

    const formattedSignals = trustSignals.map(signal => ({
      id: signal._id.toString(),
      title: signal.title || '',
      icon: signal.icon || null,
      description: signal.description || null
    }));

    return res.json({
      success: true,
      data: formattedSignals
    });
  } catch (error) {
    console.error('Get trust signals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get trust signals'
    });
  }
});

module.exports = router;

