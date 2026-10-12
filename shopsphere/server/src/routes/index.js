const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Quick check used by the README: http://localhost:5000/api/health
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  })
);

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
