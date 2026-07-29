const Order = require('../models/Order');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const RevertRequest = require('../models/RevertRequest');
const Notification = require('../models/Notification');

// Helper to monitor order deadlines & create notifications if approaching/missed
const processDeadlineMonitoring = async (companyId) => {
  try {
    const activeOrders = await Order.find({
      companyId,
      status: { $in: ['In Progress', 'Delayed', 'Pending Revert Approval'] }
    });

    const now = new Date();

    for (const order of activeOrders) {
      if (!order.dueDate) continue;

      const due = new Date(order.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Deadline passed (Overdue)
      if (diffHours < 0 && order.status !== 'Completed' && order.status !== 'Delayed') {
        order.status = 'Delayed';
        await order.save();

        // Check if deadline missed notification already sent recently
        const existing = await Notification.findOne({
          companyId,
          title: `Deadline Missed: #${order.orderNumber}`,
          createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
        });

        if (!existing) {
          await Notification.create({
            companyId,
            recipientRole: 'all',
            recipientDepartmentId: order.currentDepartmentId,
            title: `Deadline Missed: #${order.orderNumber}`,
            message: `Order #${order.orderNumber} (${order.productName}) has passed its due date (${due.toLocaleDateString()})!`,
            type: 'DEADLINE_MISSED'
          });
        }
      } else if (diffHours > 0 && diffHours <= 24) {
        // Less than 24h remaining
        const existing = await Notification.findOne({
          companyId,
          title: `Urgent Deadline (< 24h): #${order.orderNumber}`,
          createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
        });

        if (!existing) {
          await Notification.create({
            companyId,
            recipientRole: 'all',
            recipientDepartmentId: order.currentDepartmentId,
            title: `Urgent Deadline (< 24h): #${order.orderNumber}`,
            message: `Order #${order.orderNumber} is due in less than 24 hours (${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})!`,
            type: 'DEADLINE_APPROACHING'
          });
        }
      } else if (diffHours > 24 && diffHours <= 48) {
        // Less than 48h remaining
        const existing = await Notification.findOne({
          companyId,
          title: `Deadline Approaching (< 48h): #${order.orderNumber}`,
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });

        if (!existing) {
          await Notification.create({
            companyId,
            recipientRole: 'all',
            recipientDepartmentId: order.currentDepartmentId,
            title: `Deadline Approaching (< 48h): #${order.orderNumber}`,
            message: `Order #${order.orderNumber} is due in 48 hours. Please expedite processing.`,
            type: 'DEADLINE_APPROACHING'
          });
        }
      }
    }
  } catch (err) {
    console.error('Deadline monitoring error:', err);
  }
};

// @desc Get Dashboard Overview Metrics
// @route GET /api/reports/dashboard
// @access Private (Owner only)
const getDashboardMetrics = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    // Trigger deadline monitoring check
    await processDeadlineMonitoring(companyId);

    const totalOrders = await Order.countDocuments({ companyId });
    const inProgress = await Order.countDocuments({ companyId, status: 'In Progress' });
    const completed = await Order.countDocuments({ companyId, status: 'Completed' });
    const delayed = await Order.countDocuments({ companyId, status: 'Delayed' });
    const pendingRevertsCount = await RevertRequest.countDocuments({ companyId, status: 'Pending' });

    // Orders near deadline (within 48 hours)
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const nearDeadlineOrders = await Order.find({
      companyId,
      status: { $in: ['In Progress', 'Delayed', 'Pending Revert Approval'] },
      dueDate: { $lte: in48Hours }
    })
      .populate('currentDepartmentId', 'name')
      .populate('currentStageId', 'name')
      .sort({ dueDate: 1 })
      .limit(10);

    // Department loads summary
    const departments = await Department.find({ companyId }).sort({ orderIndex: 1 });
    const departmentLoads = await Promise.all(
      departments.map(async (dept) => {
        const count = await Order.countDocuments({
          companyId,
          currentDepartmentId: dept._id,
          status: { $in: ['In Progress', 'Delayed', 'Pending Revert Approval'] }
        });
        return {
          _id: dept._id,
          name: dept.name,
          activeOrders: count
        };
      })
    );

    // Recent activity log feed
    const recentActivity = await ActivityLog.find({ companyId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      summary: {
        totalOrders,
        inProgress,
        completed,
        delayed,
        pendingReverts: pendingRevertsCount,
        nearDeadlineCount: nearDeadlineOrders.length
      },
      nearDeadlineOrders,
      departmentLoads,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

// @desc Export Orders as CSV
// @route GET /api/reports/export
// @access Private (Owner only)
const exportOrdersCSV = async (req, res, next) => {
  try {
    const orders = await Order.find({ companyId: req.companyId })
      .populate('currentStageId', 'name')
      .populate('currentDepartmentId', 'name')
      .sort({ createdAt: -1 });

    const headers = ['Order Number', 'Customer', 'Product', 'Quantity', 'Priority', 'Status', 'Current Department', 'Current Stage', 'Due Date', 'Created Date'];
    
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.customerName}"`,
      `"${o.productName}"`,
      o.quantity,
      `"${o.priority}"`,
      `"${o.status}"`,
      `"${o.currentDepartmentId ? o.currentDepartmentId.name : 'N/A'}"`,
      `"${o.currentStageId ? o.currentStageId.name : 'N/A'}"`,
      `"${new Date(o.dueDate).toISOString().split('T')[0]}"`,
      `"${new Date(o.creationTime).toISOString().split('T')[0]}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="FlowForge_Orders_Report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  exportOrdersCSV
};
