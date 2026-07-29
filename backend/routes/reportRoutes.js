const express = require('express');
const router = express.Router();
const { getDashboardMetrics, exportOrdersCSV } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('owner'));

router.get('/dashboard', getDashboardMetrics);
router.get('/export', exportOrdersCSV);

module.exports = router;
