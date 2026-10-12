const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/cartController');

const router = express.Router();

router.use(authenticate); // every cart route needs a logged-in user

router.get('/', asyncHandler(controller.getCart));
router.post('/', asyncHandler(controller.addItem));
router.delete('/', asyncHandler(controller.clearCart));
router.put('/:productId', asyncHandler(controller.updateItem));
router.delete('/:productId', asyncHandler(controller.removeItem));

module.exports = router;
