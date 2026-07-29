const express = require('express');
const router = express.Router();
const {
  createRevertRequest,
  getRevertRequests,
  approveRevertRequest,
  rejectRevertRequest
} = require('../controllers/revertRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createRevertRequest);
router.get('/', getRevertRequests);
router.post('/:id/approve', authorize('owner'), approveRevertRequest);
router.post('/:id/reject', authorize('owner'), rejectRevertRequest);

module.exports = router;
