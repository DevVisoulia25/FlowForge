const Notification = require('../models/Notification');

// @desc Get Notifications for current user context
// @route GET /api/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    let query = { companyId: req.companyId };

    if (req.user.role === 'department') {
      const deptId = req.user.departmentId?._id || req.user.departmentId;
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'department', recipientDepartmentId: deptId },
        { recipient: req.user._id }
      ];
    } else {
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'owner' },
        { recipient: req.user._id }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc Mark single notification as read
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

// @desc Mark all notifications as read for user/company context
// @route PUT /api/notifications/read-all
// @access Private
const markAllAsRead = async (req, res, next) => {
  try {
    let query = { companyId: req.companyId, isRead: false };

    if (req.user.role === 'department') {
      const deptId = req.user.departmentId?._id || req.user.departmentId;
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'department', recipientDepartmentId: deptId },
        { recipient: req.user._id }
      ];
    } else {
      query.$or = [
        { recipientRole: 'all' },
        { recipientRole: 'owner' },
        { recipient: req.user._id }
      ];
    }

    await Notification.updateMany(query, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
