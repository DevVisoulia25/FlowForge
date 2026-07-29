const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  reorderDepartments
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getDepartments);
router.post('/', authorize('owner'), createDepartment);
router.put('/reorder', authorize('owner'), reorderDepartments);
router.put('/:id', authorize('owner'), updateDepartment);
router.delete('/:id', authorize('owner'), deleteDepartment);

module.exports = router;
