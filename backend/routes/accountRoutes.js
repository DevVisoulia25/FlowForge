const express = require('express');
const router = express.Router();
const {
  updateOwnerAccount,
  getDepartmentAccounts,
  updateDepartmentAccount
} = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/owner', authorize('owner'), updateOwnerAccount);
router.get('/departments', authorize('owner'), getDepartmentAccounts);
router.put('/department/:id', authorize('owner'), updateDepartmentAccount);

module.exports = router;
