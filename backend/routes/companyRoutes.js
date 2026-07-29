const express = require('express');
const router = express.Router();
const { completeSetup, getProfile, updateProfile } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/setup', protect, authorize('owner'), completeSetup);
router.get('/profile', protect, authorize('owner'), getProfile);
router.put('/profile', protect, authorize('owner'), updateProfile);

module.exports = router;
