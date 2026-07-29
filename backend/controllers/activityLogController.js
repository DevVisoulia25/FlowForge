const ActivityLog = require('../models/ActivityLog');

// @desc Get Activity Logs
// @route GET /api/activity-logs
// @access Private (Owner only)
const getActivityLogs = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    let query = { companyId: req.companyId };

    if (orderId) {
      query.orderId = orderId;
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs
};
