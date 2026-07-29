const express = require('express');
const router = express.Router();
const {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages
} = require('../controllers/stageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getStages);
router.post('/', authorize('owner'), createStage);
router.put('/reorder', authorize('owner'), reorderStages);
router.put('/:id', authorize('owner'), updateStage);
router.delete('/:id', authorize('owner'), deleteStage);

module.exports = router;
