const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/adminController');

const router = express.Router();

// Every route in this file requires a logged-in ADMIN.
router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(controller.stats));
router.get('/orders', asyncHandler(controller.listOrders));
router.get('/orders/:id', asyncHandler(controller.getOrder));
router.patch('/orders/:id/status', asyncHandler(controller.updateOrderStatus));

module.exports = router;
