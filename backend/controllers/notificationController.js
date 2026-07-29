const Notification = require('../models/Notification');

// @desc Get Notifications for current user context
// @route GET /api/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    let query = { companyId: req.companyId };

    if (req.user.role === 'department') {
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'department', recipientDepartmentId: req.user.departmentId }
      ];
    } else {
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'owner' }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
// @access Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
