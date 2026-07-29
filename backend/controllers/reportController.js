const Order = require('../models/Order');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');

// @desc Get Dashboard Overview Metrics
// @route GET /api/reports/dashboard
// @access Private (Owner only)
const getDashboardMetrics = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const totalOrders = await Order.countDocuments({ companyId });
    const inProgress = await Order.countDocuments({ companyId, status: 'In Progress' });
    const completed = await Order.countDocuments({ companyId, status: 'Completed' });
    const delayed = await Order.countDocuments({ companyId, status: 'Delayed' });

    // Today's Orders count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrdersCount = await Order.countDocuments({
      companyId,
      creationTime: { $gte: startOfToday }
    });

    // Department loads summary
    const departments = await Department.find({ companyId }).sort({ orderIndex: 1 });
    const departmentLoads = await Promise.all(
      departments.map(async (dept) => {
        const count = await Order.countDocuments({
          companyId,
          currentDepartmentId: dept._id,
          status: { $in: ['In Progress', 'Delayed'] }
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
        todayOrders: todayOrdersCount
      },
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
