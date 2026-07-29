const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  completeStage,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getOrders);
router.post('/', authorize('owner'), createOrder);
router.get('/:id', getOrderById);
router.put('/:id', authorize('owner'), updateOrder);
router.delete('/:id', authorize('owner'), deleteOrder);
router.post('/:id/complete-stage', completeStage);

module.exports = router;
