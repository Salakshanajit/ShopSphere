const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/productController');

const router = express.Router();

// Public: anyone can browse the catalog
router.get('/', asyncHandler(controller.list));
router.get('/categories', asyncHandler(controller.categories)); // must stay above "/:id"
router.get('/:id', asyncHandler(controller.getById));

// Admin only
router.post('/', authenticate, requireAdmin, asyncHandler(controller.create));
router.put('/:id', authenticate, requireAdmin, asyncHandler(controller.update));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(controller.remove));

module.exports = router;
